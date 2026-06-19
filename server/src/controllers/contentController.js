import SiteContent from "../models/SiteContent.js";
import { defaultContent } from "../data/defaultContent.js";

// Public: get content, optionally filtered by page. Returns a flat key->value map plus meta.
export async function getContent(req, res) {
  const { page } = req.query;
  const filter = page ? { page } : {};
  const items = await SiteContent.find(filter).lean();

  const map = {};
  for (const item of items) map[item.key] = item.value;
  res.json({ map, items });
}

// Admin: update a single content item by key.
export async function updateContentItem(req, res) {
  const { value } = req.body;
  const item = await SiteContent.findOneAndUpdate(
    { key: req.params.key },
    { value },
    { new: true, upsert: true }
  );
  res.json(item);
}

// Admin: bulk update [{ key, value }]
export async function bulkUpdateContent(req, res) {
  const updates = req.body.updates;
  if (!Array.isArray(updates) || updates.length > 500) {
    return res.status(400).json({ message: "updates must be an array of at most 500 items" });
  }
  await Promise.all(
    updates.map((u) =>
      SiteContent.findOneAndUpdate({ key: u.key }, { value: u.value }, { upsert: true })
    )
  );
  res.json({ message: `Updated ${updates.length} items` });
}

// Admin: seed default content (idempotent — only inserts missing keys)
export async function seedContent(req, res) {
  try {
    await SiteContent.insertMany(defaultContent, { ordered: false });
  } catch (err) {
    // ignore duplicate key errors (E11000) — existing keys are skipped
    if (err.code !== 11000 && err.name !== "BulkWriteError") throw err;
  }
  res.json({ message: "Content seeded" });
}
