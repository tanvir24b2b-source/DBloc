import xss from "xss";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Bloc from "../models/Bloc.js";
import User from "../models/User.js";
import BannedIP from "../models/BannedIP.js";
import CourierSettings from "../models/CourierSettings.js";
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
  const [bannedIPs, courierSettingsData] = await Promise.all([
    BannedIP.getSingleton(),
    CourierSettings.getSingleton().catch(() => null),
  ]);
  if (clientIp && bannedIPs.ips.includes(clientIp)) {
    return res.status(403).json({ message: "Unable to place order. Please contact support." });
  }

  const { blocId, mobile, email, password, quantity = 1, paymentMethod = "cod", transactionId = "", deliveryZone = "inside_dhaka" } = req.body;
  const customerName = req.body.customerName ? xss(req.body.customerName) : req.body.customerName;
  const address = req.body.address ? xss(req.body.address) : req.body.address;

  // Validate quantity is a positive integer
  const qty = Math.floor(Number(quantity));
  if (!qty || qty < 1 || qty > 100) return res.status(400).json({ message: "Quantity must be between 1 and 100" });

  // Expiry check — read current doc first so we can reject before attempting reservation
  const blocCheck = await Bloc.findById(blocId);
  if (!blocCheck) return res.status(404).json({ message: "Bloc not found" });
  if (new Date(blocCheck.endTime) < new Date()) return res.status(400).json({ message: "This Bloc has expired" });

  // Duplicate join check — one join per phone per bloc; also check by user account if logged in
  const dupChecks = [Order.findOne({ bloc: blocId, mobile: reqMobile })];
  if (req.user) dupChecks.push(Order.findOne({ bloc: blocId, user: req.user._id }));
  const [dupByPhone, dupByUser] = await Promise.all(dupChecks);
  if (dupByPhone || dupByUser) {
    return res.status(409).json({ message: "You have already joined this Bloc. Each customer can join once." });
  }

  // Atomic spots reservation — prevents race condition overselling.
  // Uses $expr so both filledSpots and maxSpots are read atomically from the DB,
  // avoiding stale-read overselling when maxSpots was fetched before a concurrent update.
  const reserved = await Bloc.findOneAndUpdate(
    { _id: blocId, $expr: { $lte: [{ $add: ["$filledSpots", qty] }, "$maxSpots"] } },
    { $inc: { filledSpots: qty } },
    { new: true }
  );
  if (!reserved) return res.status(400).json({ message: "This Bloc is full" });
  const bloc = reserved;

  // Resolve / register customer. Every order creates a customer record in the admin Customers list.
  let user = req.user || null;
  let isNewUser = false;
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
      const { randomBytes } = await import("crypto");
      const pwd = password || randomBytes(16).toString("hex");
      const safeEmail = email?.toLowerCase() || `guest_${mobile || Date.now()}@dblock.local`;
      try {
        user = await User.create({ name: customerName, email: safeEmail, password: pwd, mobile, address, role: "user" });
        isNewUser = true;
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
      if (address && !user.address) user.address = address;
      await user.save();
    }
  }

  // Compute delivery charge server-side from CourierSettings — never trust the client value
  const deliveryChargeComputed = courierSettingsData
    ? (bloc.shippingException || courierSettingsData.freeDeliveryAll ? 0
      : deliveryZone === "inside_dhaka" ? (courierSettingsData.insideDhakaCharge || 0)
      : (courierSettingsData.outsideDhakaCharge || 0))
    : 0;

  const amount = bloc.blocPrice * qty;
  let order;
  try {
    order = await Order.create({ user: user?._id, bloc: bloc._id, customerName, mobile, email, address, quantity: qty, amount, paymentMethod, transactionId, deliveryZone, deliveryCharge: deliveryChargeComputed, clientIp });
  } catch (err) {
    // Order write failed — roll back the spot reservation and any just-created user
    await Bloc.findByIdAndUpdate(bloc._id, { $inc: { filledSpots: -qty } });
    if (isNewUser && user?._id) await User.findByIdAndDelete(user._id).catch(() => {});
    throw err;
  }

  // Push to CRM integrations (EcomDrive, Bismation, etc.)
  pushOrderToIntegrations(order, bloc);

  // SMS + Email: manual payment methods need verification before confirming
  const isManualPayment = ["bkashmanual", "nagad"].includes(paymentMethod);
  const smsTemplate   = isManualPayment ? "orderReceived"   : "orderConfirmed";
  const emailTemplate = isManualPayment ? "orderReceived"   : "orderConfirmed";
  const emailSubject  = isManualPayment ? "Order Received — D BLOC" : "Order Confirmed — D BLOC";
  sendSms(mobile, smsTemplate, {
    name: customerName,
    orderId: order.orderId || order._id,
    amount: `৳${amount}`,
  });
  if (email) sendEmail(email, emailTemplate, {
    name: customerName,
    orderId: order.orderId || order._id,
    amount: `৳${amount}`,
    subject: emailSubject,
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

  // Mobile lookup: only allowed for the authenticated user themselves or admin staff
  const isStaff = req.user && ["moderator", "subadmin", "admin", "master_admin"].includes(req.user.role);
  const isOwn = req.user && req.user.mobile === mobile;
  if (!isStaff && !isOwn) {
    return res.status(403).json({ message: "Mobile lookup requires authentication" });
  }
  const orders = await Order.find({ mobile })
    .populate("bloc", "title image")
    .select("orderId customerName status paymentStatus amount quantity createdAt bloc")
    .sort({ createdAt: -1 })
    .limit(10);
  if (!orders.length) return res.status(404).json({ message: "No orders found" });
  res.json(orders);
}

export async function myOrders(req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id })
      .populate("bloc", "title image blocPrice")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments({ user: req.user._id }),
  ]);
  res.json({ orders, total, page, pages: Math.ceil(total / limit) });
}

// Recent orders for a bloc — public, used for "Recent Joins" feed on product page
export async function recentBlocOrders(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.blocId)) {
    return res.status(400).json({ message: "Invalid bloc ID" });
  }
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [recent, older, count24h] = await Promise.all([
    // Recent zone: last 24h, newest first, up to 5
    Order.find({ bloc: req.params.blocId, createdAt: { $gte: since24h } })
      .sort({ createdAt: -1 }).limit(5).select("customerName mobile createdAt"),
    // Shuffle zone: older than 24h, up to 20
    Order.find({ bloc: req.params.blocId, createdAt: { $lt: since24h } })
      .sort({ createdAt: -1 }).limit(20).select("customerName mobile createdAt"),
    Order.countDocuments({ bloc: req.params.blocId, createdAt: { $gte: since24h } }),
  ]);

  const mask = (phone = "") => {
    if (phone.length <= 4) return "****";
    return "*".repeat(phone.length - 4) + phone.slice(-4);
  };
  const ago = (date) => {
    const m = Math.round((Date.now() - new Date(date)) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.round(h / 24)}d ago`;
  };
  const fmt = (o) => ({ name: o.customerName || "Someone", phone: mask(o.mobile), time: ago(o.createdAt) });

  res.json({
    orders: recent.map(fmt),
    older: older.map(fmt),
    count24h,
  });
}

// --- Admin: edit order details (allowed only before shipped) ---
export async function editOrder(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (["shipped", "delivered", "pending_return", "returned"].includes(order.status)) {
    return res.status(400).json({ message: "Cannot edit order after it has been shipped" });
  }
  const originalQty = order.quantity;
  const allowed = ["customerName", "mobile", "email", "address", "deliveryZone", "deliveryCharge", "discount", "note", "courierName", "quantity"];
  for (const key of allowed) {
    if (req.body[key] === undefined) continue;
    if (["deliveryCharge", "discount"].includes(key)) {
      const n = Number(req.body[key]);
      if (isNaN(n) || n < 0) continue;
      order[key] = n;
    } else if (key === "quantity") {
      const n = Math.floor(Number(req.body[key]));
      if (isNaN(n) || n < 1) continue;
      order[key] = n;
    } else {
      order[key] = ["customerName", "address", "note"].includes(key) ? xss(req.body[key]) : req.body[key];
    }
  }
  let blocReassigned = false;
  if (req.body.bloc && req.body.bloc !== String(order.bloc)) {
    const newBloc = await Bloc.findById(req.body.bloc);
    if (!newBloc) return res.status(404).json({ message: "Target bloc not found" });
    // Adjust filledSpots: decrement old bloc (with floor guard), increment new bloc (using originalQty)
    await Promise.all([
      Bloc.findOneAndUpdate(
        { _id: order.bloc, filledSpots: { $gte: originalQty } },
        { $inc: { filledSpots: -originalQty } }
      ),
      Bloc.findByIdAndUpdate(req.body.bloc, { $inc: { filledSpots: originalQty } }),
    ]);
    blocReassigned = true;
    order.changeLog.push({ field: "bloc", from: String(order.bloc), to: req.body.bloc });
    order.bloc = req.body.bloc;
  }

  // Sync filledSpots delta when quantity changes and bloc was NOT reassigned
  // (bloc reassignment already handled exact counts above)
  if (!blocReassigned && req.body.quantity !== undefined) {
    const newQty = order.quantity; // already validated and set above
    const delta = newQty - originalQty;
    if (delta < 0) {
      await Bloc.findOneAndUpdate(
        { _id: order.bloc, filledSpots: { $gte: -delta } },
        { $inc: { filledSpots: delta } }
      );
    } else if (delta > 0) {
      await Bloc.findByIdAndUpdate(order.bloc, { $inc: { filledSpots: delta } });
    }
  }

  await order.save();
  await order.populate("bloc", "title image blocPrice");
  res.json(order);
}

// --- Admin ---
export async function allOrders(req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 50);
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find().populate("bloc", "title image blocPrice").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(),
  ]);
  res.json({ orders, total, page, pages: Math.ceil(total / limit) });
}

const STATUS_NOTIFY = {
  shipped:   { key: "orderShipped",   subject: "Your Order Has Been Shipped — D BLOC" },
  delivered: { key: "orderDelivered", subject: "Your Order Has Been Delivered — D BLOC" },
};

const VALID_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "pending_return", "returned"];
const VALID_PAYMENT_STATUSES = ["pending", "paid", "failed"];

export async function updateOrderStatus(req, res) {
  const { status, paymentStatus } = req.body;
  if (status && !VALID_STATUSES.includes(status))
    return res.status(400).json({ message: "Invalid status value" });
  if (paymentStatus && !VALID_PAYMENT_STATUSES.includes(paymentStatus))
    return res.status(400).json({ message: "Invalid paymentStatus value" });
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
