import mongoose from "mongoose";

const IntegrationSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  slug:        { type: String, required: true, unique: true },
  enabled:     { type: Boolean, default: false },
  apiUrl:      { type: String, default: "" },
  apiKey:      { type: String, default: "" },
  webhookSecret: { type: String, default: "" },
  syncOrders:    { type: Boolean, default: true },
  syncInventory: { type: Boolean, default: false },
  webhookUrl:    { type: String, default: "" },
  notes:         { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("Integration", IntegrationSchema);
