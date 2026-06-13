import Integration from "../models/Integration.js";

export async function list(req, res) {
  const items = await Integration.find().sort("name");
  res.json({ integrations: items });
}

export async function create(req, res) {
  const { name, apiUrl, apiKey, webhookUrl, webhookSecret, syncOrders, syncInventory, notes } = req.body;
  if (!name) return res.status(400).json({ message: "name required" });
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const existing = await Integration.findOne({ slug });
  if (existing) return res.status(409).json({ message: "Integration with this name already exists" });
  const item = await Integration.create({ name, slug, apiUrl, apiKey, webhookUrl, webhookSecret, syncOrders, syncInventory, notes });
  res.status(201).json({ integration: item });
}

export async function update(req, res) {
  const allowed = ["name", "enabled", "apiUrl", "apiKey", "webhookUrl", "webhookSecret", "syncOrders", "syncInventory", "notes"];
  const patch = {};
  for (const k of allowed) if (req.body[k] !== undefined) patch[k] = req.body[k];
  const item = await Integration.findByIdAndUpdate(req.params.id, patch, { new: true });
  if (!item) return res.status(404).json({ message: "Not found" });
  res.json({ integration: item });
}

export async function remove(req, res) {
  await Integration.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
}

// Called internally when a new order is placed
export async function pushOrderToIntegrations(order, bloc) {
  const integrations = await Integration.find({ enabled: true, syncOrders: true });
  for (const intg of integrations) {
    const url = intg.webhookUrl || intg.apiUrl;
    if (!url) continue;
    try {
      const payload = {
        // WooCommerce-compatible format — works with EcomDrive
        id: order.orderId || order._id,
        status: "on-hold",
        currency: "BDT",
        billing: {
          first_name: order.customerName,
          phone:      order.mobile,
          email:      order.email || "",
          address_1:  order.address,
          country:    "BD",
        },
        line_items: [{
          name:     bloc?.name || "D BLOC Product",
          quantity: order.quantity,
          price:    order.amount / order.quantity,
          total:    String(order.amount),
        }],
        payment_method_title: order.paymentMethod || "cod",
        total: String(order.amount),
        meta_data: [{ key: "source", value: "D BLOC" }],
      };

      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(intg.apiKey ? { Authorization: `Bearer ${intg.apiKey}` } : {}),
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error(`[Integration:${intg.name}] push failed:`, err.message);
    }
  }
}
