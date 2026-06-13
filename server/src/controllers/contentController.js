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
  const updates = req.body.updates || [];
  await Promise.all(
    updates.map((u) =>
      SiteContent.findOneAndUpdate({ key: u.key }, { value: u.value }, { upsert: true })
    )
  );
  res.json({ message: `Updated ${updates.length} items` });
}

// Admin: seed default content (idempotent — only inserts missing keys)
export async function seedContent(req, res) {
  let created = 0;
  for (const c of defaultContent) {
    const exists = await SiteContent.findOne({ key: c.key });
    if (!exists) {
      await SiteContent.create(c);
      created++;
    }
  }
  res.json({ message: `Seeded ${created} new content items (${defaultContent.length} total)` });
}
