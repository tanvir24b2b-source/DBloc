import EmailSettings from "../models/EmailSettings.js";
import { sendEmail } from "../utils/email.js";

export async function getSettings(req, res) {
  const s = await EmailSettings.findById("email") || await EmailSettings.create({ _id: "email" });
  // Mask password so it never leaves the server in plaintext
  const obj = s.toObject();
  if (obj.pass) obj.pass = "••••••";
  res.json({ settings: obj });
}

export async function updateSettings(req, res) {
  const allowed = ["enabled", "host", "port", "secure", "user", "pass", "fromName", "templates"];
  const update = {};
  for (const key of allowed) {
    if (req.body[key] === undefined) continue;
    if (key === "pass" && req.body[key] === "••••••") continue; // ignore masked placeholder
    update[key] = req.body[key];
  }
  const s = await EmailSettings.findByIdAndUpdate("email", { $set: update }, { new: true, upsert: true });
  res.json({ settings: { ...s.toObject(), pass: s.pass ? "••••••" : "" } });
}

export async function testEmail(req, res) {
  const { to } = req.body;
  if (!to) return res.status(400).json({ message: "to email required" });
  await sendEmail(to, "orderConfirmed", {
    name: "Test User",
    orderId: "TEST-001",
    amount: "৳1,200",
    subject: "D BLOC — Test Email",
  });
  res.json({ message: "Test email sent (check inbox)" });
}
