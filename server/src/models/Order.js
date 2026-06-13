import mongoose from "mongoose";
import { nanoid } from "nanoid";

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

    paymentMethod: { type: String, enum: ["sslcommerz", "bkash", "cod"], default: "cod" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },

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

orderSchema.pre("save", function (next) {
  if (!this.orderId) {
    this.orderId = "DB" + nanoid(8).toUpperCase();
  }
  next();
});

export default mongoose.model("Order", orderSchema);
