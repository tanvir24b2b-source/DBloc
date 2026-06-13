import SmsSettings from "../models/SmsSettings.js";
import { sendSms } from "../utils/sms.js";

export async function getSettings(req, res) {
  const s = await SmsSettings.findById("sms") || await SmsSettings.create({ _id: "sms" });
  res.json({ settings: s });
}

export async function updateSettings(req, res) {
  const allowed = ["enabled", "provider", "apiUrl", "apiKey", "senderId",
    "apiKeyField", "senderField", "numberField", "messageField", "templates"];
  const update = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }
  const s = await SmsSettings.findByIdAndUpdate("sms", { $set: update }, { new: true, upsert: true });
  res.json({ settings: s });
}

export async function testSms(req, res) {
  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ message: "mobile required" });
  await sendSms(mobile, "orderConfirmed", {
    name: "Test User",
    orderId: "#TEST-001",
    amount: "৳1,200",
  });
  res.json({ message: "Test SMS sent (check your phone)" });
}
