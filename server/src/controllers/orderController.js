import Order from "../models/Order.js";
import Bloc from "../models/Bloc.js";
import User from "../models/User.js";
import { signAccessToken, signRefreshToken, cookieOptions } from "../utils/tokens.js";

const publicUser = (u) => ({ _id: u._id, name: u.name, email: u.email, mobile: u.mobile, address: u.address, role: u.role, permissions: u.permissions || [] });

// Place order — joins a bloc. Auto-registers new users if password provided.
export async function placeOrder(req, res) {
  const { blocId, customerName, mobile, email, address, password, quantity = 1, paymentMethod = "cod" } = req.body;

  // Validate quantity is a positive integer
  const qty = Math.floor(Number(quantity));
  if (!qty || qty < 1 || qty > 100) return res.status(400).json({ message: "Quantity must be between 1 and 100" });

  const bloc = await Bloc.findById(blocId);
  if (!bloc) return res.status(404).json({ message: "Bloc not found" });
  if (new Date(bloc.endTime) < new Date()) return res.status(400).json({ message: "This Bloc has expired" });

  // Atomic spots reservation — prevents race condition overselling.
  // Only succeeds if there are enough spots left; returns null if full.
  const reserved = await Bloc.findOneAndUpdate(
    { _id: bloc._id, filledSpots: { $lte: bloc.maxSpots - qty } },
    { $inc: { filledSpots: qty } },
    { new: true }
  );
  if (!reserved) return res.status(400).json({ message: "This Bloc is full" });

  // Resolve / register customer. Every order creates a customer record in the admin Customers list.
  let user = req.user || null;
  let accessToken = null;
  if (!user) {
    // Try to find an existing customer by email or mobile
    const or = [];
    if (email) or.push({ email: email.toLowerCase() });
    if (mobile) or.push({ mobile });
    if (or.length) user = await User.findOne({ $or: or });

    if (!user) {
      // Create a new customer. If no password given (guest checkout), generate a random one.
      const isGuest = !password;
      const pwd = password || Math.random().toString(36).slice(-10) + "A1";
      const safeEmail = email?.toLowerCase() || `guest_${mobile || Date.now()}@dblock.local`;
      try {
        user = await User.create({ name: customerName, email: safeEmail, password: pwd, mobile, address, role: "user" });
      } catch (dupErr) {
        // Race: another request created the same guest — fetch and reuse
        if (dupErr.code === 11000) {
          user = await User.findOne({ email: safeEmail });
        } else {
          throw dupErr;
        }
      }
      if (!isGuest && user) {
        accessToken = signAccessToken(user);
        res.cookie("refreshToken", signRefreshToken(user), cookieOptions);
      }
    } else {
      if (mobile && !user.mobile) user.mobile = mobile;
      if (address) user.address = address;
      await user.save();
    }
  }

  const amount = bloc.blocPrice * qty;
  let order;
  try {
    order = await Order.create({
      user: user?._id,
      bloc: bloc._id,
      customerName,
      mobile,
      email,
      address,
      quantity: qty,
      amount,
      paymentMethod,
    });
  } catch (err) {
    await Bloc.findByIdAndUpdate(bloc._id, { $inc: { filledSpots: -qty } });
    throw err;
  }

  res.status(201).json({ order, accessToken, user: user ? publicUser(user) : null });
}

export async function trackOrder(req, res) {
  const { orderId, mobile } = req.query;
  if (!orderId && !mobile) return res.status(400).json({ message: "Provide orderId or mobile" });

  // Order ID lookup: return full details (user knows their own ID)
  if (orderId) {
    const order = await Order.findOne({ orderId: orderId.toUpperCase() })
      .populate("bloc", "title image blocPrice")
      .select("orderId customerName status paymentStatus amount quantity paymentMethod createdAt bloc");
    if (!order) return res.status(404).json({ message: "No orders found" });
    return res.json([order]);
  }

  // Mobile lookup: return limited fields only — no address, no email
  const orders = await Order.find({ mobile })
    .populate("bloc", "title image")
    .select("orderId customerName status paymentStatus amount quantity createdAt bloc")
    .sort({ createdAt: -1 })
    .limit(10);
  if (!orders.length) return res.status(404).json({ message: "No orders found" });
  res.json(orders);
}

export async function myOrders(req, res) {
  const orders = await Order.find({ user: req.user._id }).populate("bloc", "title image blocPrice").sort({ createdAt: -1 });
  res.json(orders);
}

// Recent orders for a bloc — public, used for "Recent Joins" feed on product page
export async function recentBlocOrders(req, res) {
  const orders = await Order.find({ bloc: req.params.blocId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("customerName mobile createdAt");

  const mask = (phone = "") => phone.slice(0, 3) + "*".repeat(Math.max(0, phone.length - 3));
  const ago = (date) => {
    const m = Math.round((Date.now() - new Date(date)) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    return `${Math.round(m / 60)}h ago`;
  };

  res.json(orders.map((o) => ({
    name: o.customerName?.split(" ")[0] + " " + (o.customerName?.split(" ")[1]?.[0] || "") + ".",
    phone: mask(o.mobile),
    time: ago(o.createdAt),
  })));
}

// --- Admin ---
export async function allOrders(req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 50);
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find().populate("bloc", "title").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(),
  ]);
  res.json({ orders, total, page, pages: Math.ceil(total / limit) });
}

export async function updateOrderStatus(req, res) {
  const { status, paymentStatus } = req.body;
  const update = {};
  if (status) update.status = status;
  if (paymentStatus) update.paymentStatus = paymentStatus;
  const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
}
