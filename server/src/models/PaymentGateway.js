import mongoose from "mongoose";

const PaymentGatewaySchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  enabled: { type: Boolean, default: false },
  isDefault: { type: Boolean, default: false },
  credentials: { type: mongoose.Schema.Types.Mixed, default: {} },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("PaymentGateway", PaymentGatewaySchema);
