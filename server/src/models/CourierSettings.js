import mongoose from "mongoose";

const courierSettingsSchema = new mongoose.Schema({
  // Delivery charges
  insideDhakaCharge:  { type: Number, default: 70 },
  outsideDhakaCharge: { type: Number, default: 120 },
  freeDeliveryAll:    { type: Boolean, default: false },

  // Default courier
  defaultCourier: { type: String, enum: ["steadfast", "pathao"], default: "steadfast" },

  // Steadfast credentials
  steadfastApiKey:    { type: String, default: "" },
  steadfastSecretKey: { type: String, default: "" },
  steadfastEnabled:   { type: Boolean, default: false },

  // Pathao credentials
  pathaoApiKey:    { type: String, default: "" },
  pathaoSecretKey: { type: String, default: "" },
  pathaoEnabled:   { type: Boolean, default: false },
}, { timestamps: true });

courierSettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

export default mongoose.model("CourierSettings", courierSettingsSchema);
