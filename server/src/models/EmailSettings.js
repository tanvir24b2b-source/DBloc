import mongoose from "mongoose";

const EmailSettingsSchema = new mongoose.Schema({
  _id:      { type: String, default: "email" },
  enabled:  { type: Boolean, default: false },
  host:     { type: String, default: "" },   // e.g. mail.dbloc.com.bd
  port:     { type: Number, default: 465 },
  secure:   { type: Boolean, default: true }, // true for 465, false for 587
  user:     { type: String, default: "" },   // full email address
  pass:     { type: String, default: "" },   // SMTP password
  fromName: { type: String, default: "D BLOC" },
  templates: {
    orderConfirmed: { type: String, default: "Dear {{name}},\n\nYour order {{orderId}} has been placed successfully!\nTotal: {{amount}}\n\nThank you for shopping with D BLOC." },
    orderShipped:   { type: String, default: "Dear {{name}},\n\nYour order {{orderId}} has been shipped and is on the way!\n\n- D BLOC Team" },
    orderDelivered: { type: String, default: "Dear {{name}},\n\nYour order {{orderId}} has been delivered. We hope you love it!\n\n- D BLOC Team" },
    passwordResetOtp: { type: String, default: "Dear {{name}},\n\nYour D BLOC password reset OTP is: {{otp}}\n\nValid for 10 minutes. Do not share with anyone.\n\n- D BLOC Team" },
  },
}, { timestamps: true });

export default mongoose.model("EmailSettings", EmailSettingsSchema);
