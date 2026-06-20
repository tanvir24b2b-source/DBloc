import "dotenv/config";
import mongoose from "mongoose";
import Bloc from "../models/Bloc.js";

function toSlug(str) {
  return str.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const blocs = await Bloc.find({ $or: [{ slug: { $exists: false } }, { slug: "" }, { slug: null }] });
  console.log(`Found ${blocs.length} blocs without slugs`);

  for (const bloc of blocs) {
    let base = toSlug(bloc.title);
    let slug = base;
    let counter = 1;
    while (await Bloc.findOne({ slug, _id: { $ne: bloc._id } })) {
      slug = `${base}-${counter++}`;
    }
    bloc.slug = slug;
    await bloc.save();
    console.log(`  ✓ "${bloc.title}" → ${slug}`);
  }

  console.log("Done.");
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
