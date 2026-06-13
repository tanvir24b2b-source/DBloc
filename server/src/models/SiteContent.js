import mongoose from "mongoose";

const siteContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true }, // e.g. "hero.headline"
    value: { type: String, default: "" },
    type: { type: String, enum: ["text", "richtext", "image", "url", "color", "sociallinks"], default: "text" },
    page: { type: String, default: "global" }, // "global" | "home" | "allblocs" | ...
    label: { type: String, default: "" }, // human-readable label for admin UI
    group: { type: String, default: "" }, // section grouping in admin UI
  },
  { timestamps: true }
);

export default mongoose.model("SiteContent", siteContentSchema);
