import BlocRequest from "../models/BlocRequest.js";
import Bloc from "../models/Bloc.js";

export async function submitRequest(req, res) {
  const { blocId, note } = req.body;
  if (!blocId) return res.status(400).json({ message: "Bloc is required" });

  const bloc = await Bloc.findById(blocId);
  if (!bloc) return res.status(404).json({ message: "Product not found" });

  // One request per user per bloc
  const existing = await BlocRequest.findOne({ bloc: blocId, user: req.user._id });
  if (existing) return res.status(409).json({ message: "You already requested this product" });

  const request = await BlocRequest.create({
    bloc: blocId,
    user: req.user._id,
    customerName: req.user.name,
    mobile: req.user.mobile || "",
    note: note?.trim() || "",
  });

  res.status(201).json({ message: "Request submitted", id: request._id });
}

export async function listRequests(req, res) {
  const requests = await BlocRequest.find()
    .populate("bloc", "title image blocPrice originalPrice")
    .populate("user", "name mobile email")
    .sort({ createdAt: -1 });

  // Group by bloc and count
  const grouped = {};
  for (const r of requests) {
    const key = r.bloc?._id?.toString() || "unknown";
    if (!grouped[key]) {
      grouped[key] = { bloc: r.bloc, count: 0, requests: [], latestAt: r.createdAt };
    }
    grouped[key].count++;
    grouped[key].requests.push(r);
    if (r.createdAt > grouped[key].latestAt) grouped[key].latestAt = r.createdAt;
  }

  const summary = Object.values(grouped).sort((a, b) => b.count - a.count);
  res.json({ summary, total: requests.length });
}

export async function updateRequestStatus(req, res) {
  const { status } = req.body;
  const request = await BlocRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!request) return res.status(404).json({ message: "Request not found" });
  res.json(request);
}
