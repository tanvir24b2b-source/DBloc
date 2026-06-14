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

    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

orderSchema.index({ bloc: 1 });
orderSchema.index({ mobile: 1 });
orderSchema.index({ user: 1 });

orderSchema.pre("save", async function (next) {
  if (!this.orderId) {
    const last = await mongoose.model("Order").findOne({}, { orderId: 1 }).sort({ createdAt: -1 });
    const lastNum = last?.orderId ? parseInt(last.orderId.replace("DB", ""), 10) : 0;
    const nextNum = (isNaN(lastNum) ? 0 : lastNum) + 1;
    this.orderId = "DB" + String(nextNum).padStart(4, "0");
  }
  next();
});

export default mongoose.model("Order", orderSchema);
