import User from "../models/User.js";
import Bloc from "../models/Bloc.js";
import Order from "../models/Order.js";
import Subscriber from "../models/Subscriber.js";
import BannedIP from "../models/BannedIP.js";

const STAFF_ROLES = ["moderator", "subadmin", "admin", "master_admin"];

export async function dashboard(req, res) {
  const [totalBlocs, totalOrders, totalUsers, revenueAgg, blocs] = await Promise.all([
    Bloc.countDocuments(),
    Order.countDocuments(),
    User.countDocuments({ role: "user" }),
    Order.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, sum: { $sum: { $subtract: [{ $add: ["$amount", "$deliveryCharge"] }, "$discount"] } } } }]),
    Bloc.find(),
  ]);

  const activeBlocs = blocs.filter((b) => b.status === "active").length;
  const revenue = revenueAgg[0]?.sum || 0;

  res.json({ totalBlocs, activeBlocs, totalOrders, totalUsers, revenue });
}

// ── Real-time analytics for the dashboard ────────────────────────────────────
// Aggregates real order data over a date range. No random/mock values.
export async function analytics(req, res) {
  const { range = "today", from, to } = req.query;
  const now = new Date();
  const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

  let start, end;
  if (range === "yesterday") {
    const y = new Date(now); y.setDate(y.getDate() - 1);
    start = startOfDay(y); end = endOfDay(y);
  } else if (range === "week") {
    start = startOfDay(new Date(now.getTime() - 6 * 864e5)); end = now;
  } else if (range === "month") {
    start = startOfDay(new Date(now.getTime() - 29 * 864e5)); end = now;
  } else if (range === "custom" && from) {
    start = startOfDay(new Date(from));
    end = to ? endOfDay(new Date(to)) : endOfDay(new Date(from));
  } else { // today (default)
    start = startOfDay(now); end = now;
  }

  const orders = await Order.find({ createdAt: { $gte: start, $lte: end } })
    .populate("bloc", "title")
    .sort({ createdAt: -1 });

  const statusCounts = { total: orders.length, pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
  const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
  const productMap = {};
  let revenue = 0;
  const TZ_OFFSET_MIN = 6 * 60; // Asia/Dhaka (UTC+6) so peak-hour reflects local time

  for (const o of orders) {
    if (statusCounts[o.status] !== undefined) statusCounts[o.status]++;
    const localHour = new Date(o.createdAt.getTime() + TZ_OFFSET_MIN * 60000).getUTCHours();
    byHour[localHour].count++;
    const title = o.bloc?.title || "Unknown product";
    if (!productMap[title]) productMap[title] = { title, count: 0, revenue: 0 };
    productMap[title].count += o.quantity || 1;
    productMap[title].revenue += o.amount || 0;
    revenue += o.amount || 0;
  }

  const topProducts = Object.values(productMap).sort((a, b) => b.count - a.count).slice(0, 5);
  const recentOrders = orders.slice(0, 8).map((o) => ({
    orderId: o.orderId, customerName: o.customerName, amount: o.amount,
    product: o.bloc?.title || "—", status: o.status, createdAt: o.createdAt,
  }));

  // Order volume per day across the range (real series for the volume chart)
  const dayMap = {};
  for (const o of orders) {
    const key = new Date(o.createdAt.getTime() + TZ_OFFSET_MIN * 60000).toISOString().slice(0, 10);
    dayMap[key] = (dayMap[key] || 0) + 1;
  }
  const volumeSeries = Object.entries(dayMap).sort().map(([date, count]) => ({ date, count }));

  const blocs = await Bloc.find();
  const activeBlocs = blocs.filter((b) => b.status === "active").length;
  const peak = byHour.reduce((m, c) => (c.count > m.count ? c : m), { hour: 0, count: 0 });

  res.json({
    range, from: start, to: end,
    statusCounts, byHour, peakHour: peak.count ? peak.hour : null,
    topProducts, recentOrders, volumeSeries, activeBlocs, revenue,
  });
}

export async function listUsers(req, res) {
  res.json(await User.find({ role: "user" }).sort({ createdAt: -1 }));
}

export async function listCustomers(req, res) {
  const { range = "all", from, to } = req.query;
  const now = new Date();
  const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
  const endOfDay   = (d) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };

  let dateFilter = {};
  if (range === "today") {
    dateFilter = { createdAt: { $gte: startOfDay(now), $lte: endOfDay(now) } };
  } else if (range === "yesterday") {
    const y = new Date(now); y.setDate(y.getDate() - 1);
    dateFilter = { createdAt: { $gte: startOfDay(y), $lte: endOfDay(y) } };
  } else if (range === "custom" && from) {
    dateFilter = { createdAt: { $gte: startOfDay(new Date(from)), $lte: to ? endOfDay(new Date(to)) : endOfDay(new Date(from)) } };
  }

  // All customers (role=user), optionally filtered by join date
  const users = await User.find({ role: "user", ...dateFilter }).sort({ createdAt: -1 }).lean();

  // Aggregate orders per user: count + lifetime spend
  const orderAgg = await Order.aggregate([
    { $match: { user: { $in: users.map(u => u._id) } } },
    { $group: { _id: "$user", orderCount: { $sum: 1 }, totalSpend: { $sum: "$amount" } } },
  ]);
  const orderMap = {};
  for (const a of orderAgg) orderMap[a._id.toString()] = a;

  // Summary stats (always total, not date-filtered)
  const totalCustomers = await User.countDocuments({ role: "user" });
  const todayStart = startOfDay(now);
  const newToday = await User.countDocuments({ role: "user", createdAt: { $gte: todayStart } });
  const revenueAgg = await Order.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);
  const totalRevenue = revenueAgg[0]?.total || 0;

  const customers = users.map(u => {
    const stats = orderMap[u._id.toString()] || { orderCount: 0, totalSpend: 0 };
    return {
      _id: u._id,
      name: u.name,
      email: u.email,
      mobile: u.mobile || "",
      banned: u.banned,
      createdAt: u.createdAt,
      orderCount: stats.orderCount,
      totalSpend: stats.totalSpend,
    };
  });

  res.json({ customers, summary: { totalCustomers, newToday, totalRevenue } });
}

export async function updateUser(req, res) {
  const { banned, role, bannedIp } = req.body;
  const update = {};
  if (banned !== undefined) update.banned = banned;
  // customers only — staff uses /admin/staff endpoints
  if (role && !STAFF_ROLES.includes(role)) update.role = role;
  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!user) return res.status(404).json({ message: "User not found" });

  // Also ban their IP if provided
  if (banned && bannedIp) {
    const bannedIPs = await BannedIP.getSingleton();
    if (!bannedIPs.ips.includes(bannedIp)) {
      bannedIPs.ips.push(bannedIp);
      await bannedIPs.save();
    }
  }

  res.json(user);
}

// ── Staff management (master_admin only) ─────────────────────────────────────

export async function listStaff(req, res) {
  res.json(await User.find({ role: { $in: STAFF_ROLES } }).sort({ createdAt: -1 }));
}

export async function createStaff(req, res) {
  const { name, email, password, role, permissions = [] } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ message: "name, email, password, role are required" });
  if (!STAFF_ROLES.includes(role))
    return res.status(400).json({ message: "Invalid staff role" });
  // master_admin can only be created by editing DB directly — protect from UI creation
  if (role === "master_admin")
    return res.status(403).json({ message: "Cannot create another master admin from here" });

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ message: "Email already registered" });

  const staff = await User.create({ name, email, password, role, permissions });
  res.status(201).json({ _id: staff._id, name: staff.name, email: staff.email, role: staff.role, permissions: staff.permissions, createdAt: staff.createdAt });
}

export async function updateStaff(req, res) {
  const { name, role, banned, permissions } = req.body;
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ message: "User not found" });
  if (!STAFF_ROLES.includes(target.role))
    return res.status(400).json({ message: "Not a staff account" });
  if (target.role === "master_admin" && req.user._id.toString() !== target._id.toString())
    return res.status(403).json({ message: "Cannot modify another master admin" });

  const update = {};
  if (name) update.name = name;
  if (role && STAFF_ROLES.includes(role) && role !== "master_admin") update.role = role;
  if (banned !== undefined) update.banned = banned;
  if (Array.isArray(permissions)) update.permissions = permissions;

  const updated = await User.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json(updated);
}

export async function globalSearch(req, res) {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json({ orders: [], customers: [], subscribers: [], blocs: [] });

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = { $regex: escaped, $options: "i" };

  const [orders, customers, subscribers, blocs] = await Promise.all([
    Order.find({ $or: [{ orderId: re }, { customerName: re }, { mobile: re }, { email: re }] })
      .select("orderId customerName mobile status amount createdAt").limit(5),
    User.find({ role: "user", $or: [{ name: re }, { email: re }, { mobile: re }] })
      .select("name email mobile createdAt").limit(5),
    Subscriber.find({ email: re }).select("email createdAt").limit(5),
    Bloc.find({ title: re }).select("title status blocPrice").limit(5),
  ]);

  res.json({ orders, customers, subscribers, blocs });
}

export async function deleteStaff(req, res) {
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ message: "User not found" });
  if (target.role === "master_admin")
    return res.status(403).json({ message: "Cannot delete master admin" });
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "Staff account removed" });
}
