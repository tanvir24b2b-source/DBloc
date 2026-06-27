import { parse } from "csv-parse/sync";
import Category from "../models/Category.js";
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
  const { category, status, sort, featured, limit, page, q } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (featured === "true") filter.featured = true;
  // Never show hidden blocs to the public (admin can see them via separate endpoint)
  filter.hidden = { $ne: true };
  // Pre-filter expired blocs in DB when status=active is requested, to avoid large memory scans
  if (status === "active") {
    filter.endTime = { $gt: new Date() };
  }
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 100);
    filter.$or = [
    { title: { $regex: safe, $options: "i" } },
    { tags: { $regex: safe, $options: "i" } },
    { description: { $regex: safe, $options: "i" } },
  ];
  }

  let query = Bloc.find(filter).select("-gallery -fullDescription").populate("category", "name slug image");

  if (sort === "price") query = query.sort({ blocPrice: 1 });
  else if (sort === "discount") query = query.sort({ createdAt: -1 });
  else query = query.sort({ createdAt: -1 });

  // Pagination: default 50 per page, max 200. Explicit `limit` param overrides page-based pagination.
  if (limit) {
    query = query.limit(Math.min(200, Number(limit)));
  } else {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSize = 50;
    query = query.skip((pageNum - 1) * pageSize).limit(pageSize);
  }

  // Return documents (not lean) so virtuals (discount, progress, status) are serialized via toJSON.
  const docs = await query;
  const filled = await realFilledMap(docs.map((b) => b._id));
  let blocs = docs.map((b) => applyRealFill(b.toJSON(), filled[b._id.toString()] || 0));

  // status is a virtual; filter in memory if requested
  if (status) blocs = blocs.filter((b) => b.status === status);

  res.json(blocs);
}

export async function getBloc(req, res) {
  const { id } = req.params;
  const filter = id.match(/^[a-f\d]{24}$/i) ? { _id: id } : { slug: id };
  const bloc = await Bloc.findOne(filter).populate("category", "name slug");
  if (!bloc) return res.status(404).json({ message: "Bloc not found" });
  const filled = await realFilledMap([bloc._id]);
  res.json(applyRealFill(bloc.toJSON(), filled[bloc._id.toString()] || 0));
}

const BLOC_FIELDS = ["title","slug","description","shortDescription","fullDescription","image","gallery","category","tags","relatedProducts","originalPrice","blocPrice","priceTiers","maxSpots","goal","endTime","rating","reviewCount","reviews","sku","featured","hidden","shippingException","variants","features","advanceAmount","discount"];
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

export async function importBlocs(req, res) {
  if (!req.body || !req.body.csv) return res.status(400).json({ message: "No CSV data provided" });

  let rows;
  try {
    rows = parse(req.body.csv, { columns: true, skip_empty_lines: true, trim: true });
  } catch {
    return res.status(400).json({ message: "Invalid CSV format" });
  }

  // Pre-load all categories for name → _id lookup
  const categories = await Category.find().lean();
  const catMap = {};
  categories.forEach((c) => { catMap[c.name.toLowerCase()] = c._id; });

  const created = [];
  const failed  = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-indexed + header row

    // Required fields
    if (!row.title?.trim())         { failed.push({ row: rowNum, reason: "title is required" }); continue; }
    if (!row.originalPrice)         { failed.push({ row: rowNum, title: row.title, reason: "originalPrice is required" }); continue; }
    if (!row.blocPrice)             { failed.push({ row: rowNum, title: row.title, reason: "blocPrice is required" }); continue; }
    if (!row.maxSpots)              { failed.push({ row: rowNum, title: row.title, reason: "maxSpots is required" }); continue; }
    if (!row.endTime)               { failed.push({ row: rowNum, title: row.title, reason: "endTime is required" }); continue; }
    if (!row.image?.trim())         { failed.push({ row: rowNum, title: row.title, reason: "image (main image URL) is required" }); continue; }
    const isSafeUrl = (u) => /^https?:\/\//i.test(u);
    if (!isSafeUrl(row.image.trim())) { failed.push({ row: rowNum, title: row.title, reason: "image URL must start with http:// or https://" }); continue; }

    const endDate = new Date(row.endTime);
    if (isNaN(endDate.getTime())) { failed.push({ row: rowNum, title: row.title, reason: "endTime is not a valid date (use YYYY-MM-DD)" }); continue; }

    // Gallery — up to 5, only safe http(s) URLs
    const gallery = [row.gallery1, row.gallery2, row.gallery3, row.gallery4, row.gallery5]
      .filter((u) => u?.trim() && isSafeUrl(u.trim()));

    // Category lookup by name
    const catId = row.category ? catMap[row.category.toLowerCase().trim()] : undefined;

    try {
      const bloc = await Bloc.create({
        title:            row.title.trim(),
        description:      row.description?.trim()      || "",
        shortDescription: row.shortDescription?.trim() || "",
        fullDescription:  row.fullDescription?.trim()  || "",
        originalPrice:    Number(row.originalPrice),
        blocPrice:        Number(row.blocPrice),
        maxSpots:         Number(row.maxSpots),
        endTime:          endDate,
        image:            row.image.trim(),
        gallery,
        sku:              row.sku?.trim() || "",
        featured:         row.featured?.toLowerCase() === "true",
        ...(catId ? { category: catId } : {}),
      });
      created.push({ row: rowNum, title: bloc.title, id: bloc._id });
    } catch (err) {
      failed.push({ row: rowNum, title: row.title, reason: err.message });
    }
  }

  res.json({ created: created.length, failed: failed.length, details: { created, failed } });
}
