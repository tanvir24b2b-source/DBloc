import mongoose from "mongoose";

const blocSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, unique: true, sparse: true },
    description: { type: String, default: "" },       // short 1-line (used on cards)
    shortDescription: { type: String, default: "" },   // tagline / subheading
    fullDescription: { type: String, default: "" },    // rich/full product description
    image: { type: String, default: "" },
    gallery: [{ type: String }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    tags: [{ type: String }],
    relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Bloc" }],

    originalPrice: { type: Number, required: true },
    blocPrice: { type: Number, required: true },
    priceTiers: [{ min: Number, max: Number, price: Number }],  // e.g. [{min:1,max:29,price:1180}]

    maxSpots: { type: Number, required: true, default: 100 },  // Stock / capacity
    goal: { type: Number, default: 0 },                         // Unlock threshold for D-Bloc price (0 = derive from capacity)
    filledSpots: { type: Number, default: 0, min: 0 },          // Real joins, driven only by orders

    endTime: { type: Date, required: true },

    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    reviews: [{
      author: String,
      rating: { type: Number, min: 1, max: 5 },
      text: String,
      date: { type: Date, default: Date.now },
      verified: { type: Boolean, default: false },
    }],
    sku: { type: String, default: "" },
    featured: { type: Boolean, default: false },
    hidden: { type: Boolean, default: false },        // admin can hide product
    shippingException: { type: Boolean, default: false }, // free delivery override
    variants: [{
      group: String,   // e.g. "Color"
      options: [{ name: String, image: String, price: Number }],
    }],
    features: [{
      icon:  { type: String, default: "" },
      title: { type: String, default: "" },
      desc:  { type: String, default: "" },
    }],
  },
  { timestamps: true }
);

// Virtual: discount %
blocSchema.virtual("discount").get(function () {
  if (!this.originalPrice) return 0;
  return Math.round(((this.originalPrice - this.blocPrice) / this.originalPrice) * 100);
});

// Virtual: progress %
blocSchema.virtual("progress").get(function () {
  if (!this.maxSpots) return 0;
  return Math.min(100, Math.round((this.filledSpots / this.maxSpots) * 100));
});

// Virtual: status
blocSchema.virtual("status").get(function () {
  if (this.filledSpots >= this.maxSpots) return "full";
  if (new Date(this.endTime) < new Date()) return "expired";
  return "active";
});

blocSchema.set("toJSON", { virtuals: true });
blocSchema.set("toObject", { virtuals: true });

blocSchema.index({ hidden: 1, endTime: 1 });
blocSchema.index({ featured: 1, hidden: 1 });
blocSchema.index({ category: 1, hidden: 1, endTime: 1 });

export default mongoose.model("Bloc", blocSchema);
