import Subscriber from "../models/Subscriber.js";

// Public — customer signs up from the "Never miss a Bloc" strip.
export async function subscribe(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });
  const clean = email.toLowerCase().trim();

  const existing = await Subscriber.findOne({ email: clean });
  if (existing) return res.json({ message: "Already subscribed", alreadyExisted: true });

  await Subscriber.create({ email: clean });
  res.status(201).json({ message: "Subscribed" });
}

// Admin — list all subscribers (newest first).
export async function listSubscribers(req, res) {
  const subscribers = await Subscriber.find().sort({ createdAt: -1 }).lean();
  res.json({ subscribers, total: subscribers.length });
}

// Admin — remove a subscriber.
export async function deleteSubscriber(req, res) {
  await Subscriber.findByIdAndDelete(req.params.id);
  res.json({ message: "Subscriber removed" });
}
