import xss from "xss";
import Order from "../models/Order.js";
import Bloc from "../models/Bloc.js";
import User from "../models/User.js";
import BannedIP from "../models/BannedIP.js";
import { signAccessToken, signRefreshToken, cookieOptions } from "../utils/tokens.js";
import { sendSms } from "../utils/sms.js";
import { sendEmail } from "../utils/email.js";
import { pushOrderToIntegrations } from "./integrationController.js";

const publicUser = (u) => ({ _id: u._id, name: u.name, email: u.email, mobile: u.mobile, address: u.address, role: u.role, permissions: u.permissions || [] });

// Place order — joins a bloc. Auto-registers new users if password provided.
export async function placeOrder(req, res) {
  const clientIp = req.ip || "";

  // Fraud block: check banned mobile + banned IP
  const { mobile: reqMobile } = req.body;
  if (reqMobile) {
    const banned = await User.findOne({ mobile: reqMobile, banned: true });
    if (banned) return res.status(403).json({ message: "Unable to place order. Please contact support." });
  }
  if (clientIp) {
    const bannedIPs = await BannedIP.getSingleton();
    if (bannedIPs.ips.includes(clientIp)) {
      return res.status(403).json({ message: "Unable to place order. Please contact support." });
    }
  }

  const { blocId, mobile, email, password, quantity = 1, paymentMethod = "cod", transactionId = "", deliveryZone = "inside_dhaka", deliveryCharge = 0 } = req.body;
  const customerName = req.body.customerName ? xss(req.body.customerName) : req.body.customerName;
  const address = req.body.address ? xss(req.body.address) : req.body.address;

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
    order = await Order.create({ user: user?._id, bloc: bloc._id, customerName, mobile, email, address, quantity: qty, amount, paymentMethod, transactionId, deliveryZone, deliveryCharge: Number(deliveryCharge), clientIp });
  } catch (err) {
    // Order write failed — roll back the spot reservation
    await Bloc.findByIdAndUpdate(bloc._id, { $inc: { filledSpots: -qty } });
    throw err;
  }

  // Push to CRM integrations (EcomDrive, Bismation, etc.)
  pushOrderToIntegrations(order, bloc);

  // SMS + Email: order confirmed
  sendSms(mobile, "orderConfirmed", {
    name: customerName,
    orderId: order.orderId || order._id,
    amount: `৳${amount}`,
  });
  if (email) sendEmail(email, "orderConfirmed", {
    name: customerName,
    orderId: order.orderId || order._id,
    amount: `৳${amount}`,
    subject: "Order Confirmed — D BLOC",
  });

  res.status(201).json({ order, accessToken, user: user ? publicUser(user) : null });
}

export async function trackOrder(req, res) {
  // Cast to String — prevents NoSQL injection via object query params (e.g. ?mobile[$ne]=)
  const orderId = req.query.orderId != null ? String(req.query.orderId) : null;
  const mobile = req.query.mobile != null ? String(req.query.mobile) : null;
  if (!orderId && !mobile) return res.status(400).json({ message: "Provide orderId or mobile" });

  // Order ID lookup: return full details (user knows their own ID)
  if (orderId) {
    const order = await Order.findOne({ orderId: orderId.toUpperCase() })
      .populate("bloc", "title image blocPrice")
      .select("orderId customerName status paymentStatus amount quantity paymentMethod deliveryZone deliveryCharge discount trackingStatus createdAt bloc");
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

// --- Admin: edit order details (allowed only before shipped) ---
export async function editOrder(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (["shipped", "delivered", "pending_return", "returned"].includes(order.status)) {
    return res.status(400).json({ message: "Cannot edit order after it has been shipped" });
  }
  const allowed = ["customerName", "mobile", "email", "address", "deliveryZone", "deliveryCharge", "discount", "note", "courierName"];
  for (const key of allowed) {
    if (req.body[key] === undefined) continue;
    if (key === "deliveryCharge" || key === "discount") {
      const n = Number(req.body[key]);
      if (isNaN(n) || n < 0) continue; // reject negative or non-numeric
      order[key] = n;
    } else {
      order[key] = ["customerName", "address", "note"].includes(key) ? xss(req.body[key]) : req.body[key];
    }
  }
  await order.save();
  res.json(order);
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

const STATUS_NOTIFY = {
  shipped:   { key: "orderShipped",   subject: "Your Order Has Been Shipped — D BLOC" },
  delivered: { key: "orderDelivered", subject: "Your Order Has Been Delivered — D BLOC" },
};

export async function updateOrderStatus(req, res) {
  const { status, paymentStatus } = req.body;
  const update = {};
  if (status) update.status = status;
  if (paymentStatus) update.paymentStatus = paymentStatus;
  const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!order) return res.status(404).json({ message: "Order not found" });

  // SMS + Email notification on status change
  const notify = status && STATUS_NOTIFY[status];
  if (notify) {
    const vars = { name: order.customerName, orderId: order.orderId || order._id };
    if (order.mobile) sendSms(order.mobile, notify.key, vars);
    if (order.email)  sendEmail(order.email, notify.key, { ...vars, subject: notify.subject });
  }

  res.json(order);
}
