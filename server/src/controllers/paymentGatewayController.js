import PaymentGateway from "../models/PaymentGateway.js";

const GATEWAY_DEFS = [
  { type: "cod",          displayName: "Cash on Delivery", sortOrder: 0 },
  { type: "sslcommerz",   displayName: "SSLCommerz",       sortOrder: 1 },
  { type: "bkash",        displayName: "bKash (API)",      sortOrder: 2 },
  { type: "bkashmanual",  displayName: "bKash (Manual)",   sortOrder: 3 },
  { type: "nagad",        displayName: "Nagad",            sortOrder: 4 },
];

// Seed default gateways on first run
export async function seedGateways() {
  for (const def of GATEWAY_DEFS) {
    await PaymentGateway.updateOne(
      { type: def.type },
      { $setOnInsert: { ...def, enabled: def.type === "cod", isDefault: def.type === "cod" } },
      { upsert: true }
    );
  }
}

// GET /api/payment-gateways  (public — credentials hidden except manual payment info)
export async function listPublic(req, res) {
  const gateways = await PaymentGateway.find({ enabled: true }).sort("sortOrder");
  res.json({
    gateways: gateways.map((gw) => {
      const base = { _id: gw._id, type: gw.type, displayName: gw.displayName, isDefault: gw.isDefault, sortOrder: gw.sortOrder };
      // Expose number+instructions for manual gateways so checkout can display them
      if (gw.credentials?.logo) base.logo = gw.credentials.logo;
      if (gw.type === "bkashmanual" || gw.credentials?.isManual) {
        base.manualNumber = gw.credentials?.number || "";
        base.manualInstructions = gw.credentials?.instructions || "";
      }
      return base;
    }),
  });
}

// GET /api/admin/payment-gateways  (admin — full data)
export async function listAdmin(req, res) {
  const gateways = await PaymentGateway.find().sort("sortOrder");
  res.json({ gateways });
}

// PUT /api/admin/payment-gateways/:id
export async function updateGateway(req, res) {
  const { enabled, isDefault, credentials, displayName, sortOrder } = req.body;
  const gw = await PaymentGateway.findById(req.params.id);
  if (!gw) return res.status(404).json({ message: "Gateway not found" });

  if (displayName !== undefined) gw.displayName = displayName;
  if (enabled !== undefined) gw.enabled = enabled;
  if (sortOrder !== undefined) gw.sortOrder = sortOrder;
  if (credentials !== undefined) gw.credentials = { ...gw.credentials, ...credentials };

  // Only one can be default — unset others first
  if (isDefault) {
    await PaymentGateway.updateMany({ _id: { $ne: gw._id } }, { isDefault: false });
    gw.isDefault = true;
    gw.enabled = true; // default must be enabled
  }

  await gw.save();
  res.json({ gateway: gw });
}

// POST /api/admin/payment-gateways  (add custom gateway)
export async function addGateway(req, res) {
  const { type, displayName, sortOrder } = req.body;
  if (!type || !displayName) return res.status(400).json({ message: "type and displayName required" });
  const existing = await PaymentGateway.findOne({ type });
  if (existing) return res.status(409).json({ message: "Gateway type already exists" });
  const gw = await PaymentGateway.create({ type, displayName, sortOrder: sortOrder || 99 });
  res.status(201).json({ gateway: gw });
}
