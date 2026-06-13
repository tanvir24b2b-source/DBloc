import mongoose from "mongoose";

const SmsSettingsSchema = new mongoose.Schema({
  _id: { type: String, default: "sms" },
  enabled: { type: Boolean, default: false },
  provider: { type: String, default: "revesms" }, // revesms | custom
  apiUrl: { type: String, default: "" },
  apiKey: { type: String, default: "" },
  senderId: { type: String, default: "" },
  // Extra field name mappings for custom providers
  apiKeyField: { type: String, default: "apikey" },
  senderField: { type: String, default: "senderid" },
  numberField: { type: String, default: "number" },
  messageField: { type: String, default: "message" },
  templates: {
    orderConfirmed: { type: String, default: "Dear {{name}}, your order {{orderId}} has been confirmed. Total: {{amount}}. Thank you for shopping with D BLOC." },
    orderShipped:   { type: String, default: "Dear {{name}}, your order {{orderId}} has been shipped and is on the way!" },
    orderDelivered: { type: String, default: "Dear {{name}}, your order {{orderId}} has been delivered. We hope you love it! - D BLOC" },
    otpForgotPassword: { type: String, default: "Your D BLOC password reset OTP is: {{otp}}. Valid for 10 minutes. Do not share with anyone." },
  },
}, { timestamps: true });

export default mongoose.model("SmsSettings", SmsSettingsSchema);
