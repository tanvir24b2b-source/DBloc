import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    bloc: { type: mongoose.Schema.Types.ObjectId, ref: "Bloc", required: true },

    customerName: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String },
    address: { type: String, required: true },

    quantity: { type: Number, default: 1 },
    amount: { type: Number, required: true },

    paymentMethod: { type: String, default: "cod" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    transactionId: { type: String, default: "" },
    clientIp:      { type: String, default: "" },

    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "pending_return", "returned"],
      default: "pending",
    },

    deliveryZone:    { type: String, enum: ["inside_dhaka", "outside_dhaka", "free"], default: "inside_dhaka" },
    deliveryCharge:  { type: Number, default: 0 },
    discount:        { type: Number, default: 0 },
    note:            { type: String, default: "" },

    courierName:     { type: String, default: "" },
    consignmentId:   { type: String, default: "" },
    trackingStatus:  { type: String, default: "" },
    lastCourierSync: { type: Date },

    changeLog: [{
      field: { type: String },
      from:  { type: String },
      to:    { type: String },
      at:    { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

orderSchema.index({ bloc: 1 });
orderSchema.index({ mobile: 1 });
orderSchema.index({ user: 1 });

orderSchema.pre("save", async function (next) {
  if (this.orderId) return next();
  // Atomically increment the counter. On unique-key collision (race), retry up to 5 times.
  for (let attempt = 0; attempt < 5; attempt++) {
    const counter = await mongoose.model("Counter").findOneAndUpdate(
      { _id: "orderId" },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    const candidate = "DB" + String(counter.seq).padStart(4, "0");
    const exists = await mongoose.model("Order").exists({ orderId: candidate });
    if (!exists) {
      this.orderId = candidate;
      return next();
    }
  }
  // Fallback: use timestamp-based ID if all retries collide
  this.orderId = "DB" + Date.now().toString(36).toUpperCase();
  next();
});

export default mongoose.model("Order", orderSchema);
