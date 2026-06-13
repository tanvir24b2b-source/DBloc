import Category from "../models/Category.js";

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function listCategories(req, res) {
  res.json(await Category.find().sort({ name: 1 }));
}

export async function createCategory(req, res) {
  const { name, image } = req.body;
  const cat = await Category.create({ name, slug: slugify(name), image });
  res.status(201).json(cat);
}

export async function updateCategory(req, res) {
  const update = { ...req.body };
  if (req.body.name) update.slug = slugify(req.body.name);
  const cat = await Category.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!cat) return res.status(404).json({ message: "Category not found" });
  res.json(cat);
}

export async function deleteCategory(req, res) {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: "Category deleted" });
}
