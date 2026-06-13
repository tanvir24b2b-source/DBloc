import Bloc from "../models/Bloc.js";
import Order from "../models/Order.js";

// Real join count per bloc = sum of order quantities. Source of truth for filledSpots.
async function realFilledMap(blocIds) {
  const agg = await Order.aggregate([
    { $match: { bloc: { $in: blocIds } } },
    { $group: { _id: "$bloc", joined: { $sum: { $ifNull: ["$quantity", 1] } } } },
  ]);
  const map = {};
  agg.forEach((r) => { map[r._id.toString()] = r.joined; });
  return map;
}

// Override filledSpots with the real order count and recompute dependent virtuals.
function applyRealFill(json, joined) {
  json.filledSpots = joined;
  json.progress = json.maxSpots ? Math.min(100, Math.round((joined / json.maxSpots) * 100)) : 0;
  if (joined >= json.maxSpots) json.status = "full";
  else if (new Date(json.endTime) < new Date()) json.status = "expired";
  else json.status = "active";
  return json;
}

export async function listBlocs(req, res) {
  const { category, status, sort, featured, limit, q } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (featured === "true") filter.featured = true;
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 100);
    filter.$or = [
    { title: { $regex: safe, $options: "i" } },
    { tags: { $regex: safe, $options: "i" } },
    { description: { $regex: safe, $options: "i" } },
  ];
  }

  let query = Bloc.find(filter).populate("category", "name slug image");

  if (sort === "price") query = query.sort({ blocPrice: 1 });
  else if (sort === "discount") query = query.sort({ createdAt: -1 });
  else query = query.sort({ createdAt: -1 });

  if (limit) query = query.limit(Number(limit));

  // Return documents (not lean) so virtuals (discount, progress, status) are serialized via toJSON.
  const docs = await query;
  const filled = await realFilledMap(docs.map((b) => b._id));
  let blocs = docs.map((b) => applyRealFill(b.toJSON(), filled[b._id.toString()] || 0));

  // status is a virtual; filter in memory if requested
  if (status) blocs = blocs.filter((b) => b.status === status);

  res.json(blocs);
}

export async function getBloc(req, res) {
  const bloc = await Bloc.findById(req.params.id).populate("category", "name slug");
  if (!bloc) return res.status(404).json({ message: "Bloc not found" });
  const filled = await realFilledMap([bloc._id]);
  res.json(applyRealFill(bloc.toJSON(), filled[bloc._id.toString()] || 0));
}

const BLOC_FIELDS = ["title","slug","description","shortDescription","fullDescription","image","gallery","category","tags","relatedProducts","originalPrice","blocPrice","priceTiers","maxSpots","goal","endTime","rating","reviewCount","reviews","sku","featured","hidden","shippingException","variants"];
function pickBlocFields(body) {
  return Object.fromEntries(Object.entries(body).filter(([k]) => BLOC_FIELDS.includes(k)));
}

export async function createBloc(req, res) {
  const bloc = await Bloc.create(pickBlocFields(req.body));
  res.status(201).json(bloc);
}

export async function updateBloc(req, res) {
  const bloc = await Bloc.findByIdAndUpdate(req.params.id, pickBlocFields(req.body), { new: true });
  if (!bloc) return res.status(404).json({ message: "Bloc not found" });
  res.json(bloc);
}

export async function deleteBloc(req, res) {
  const bloc = await Bloc.findByIdAndDelete(req.params.id);
  if (!bloc) return res.status(404).json({ message: "Bloc not found" });
  res.json({ message: "Bloc deleted" });
}
