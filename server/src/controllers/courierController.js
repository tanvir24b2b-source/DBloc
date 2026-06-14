import axios from "axios";
import CourierSettings from "../models/CourierSettings.js";
import Order from "../models/Order.js";

// GET /api/admin/courier-settings
export async function getSettings(req, res) {
  const settings = await CourierSettings.getSingleton();
  res.json(settings);
}

// GET /api/courier-settings  (public — only delivery charges, no API keys)
export async function getPublicSettings(req, res) {
  const s = await CourierSettings.getSingleton();
  res.json({
    insideDhakaCharge:  s.insideDhakaCharge,
    outsideDhakaCharge: s.outsideDhakaCharge,
    freeDeliveryAll:    s.freeDeliveryAll,
  });
}

// PUT /api/admin/courier-settings
export async function updateSettings(req, res) {
  const allowed = [
    "insideDhakaCharge", "outsideDhakaCharge", "freeDeliveryAll",
    "defaultCourier",
    "steadfastApiKey", "steadfastSecretKey", "steadfastEnabled",
    "pathaoApiKey", "pathaoSecretKey", "pathaoEnabled",
  ];
  const settings = await CourierSettings.getSingleton();
  for (const key of allowed) {
    if (req.body[key] !== undefined) settings[key] = req.body[key];
  }
  await settings.save();
  res.json(settings);
}

// ── Steadfast API helpers ──────────────────────────────────────────────────

async function steadfastCreateConsignment(settings, order, bloc) {
  const codAmount = order.paymentMethod === "cod"
    ? (order.amount + order.deliveryCharge - order.discount)
    : 0;

  const { data } = await axios.post(
    "https://portal.packzy.com/api/v1/create_order",
    {
      invoice:           order.orderId,
      recipient_name:    order.customerName,
      recipient_phone:   order.mobile,
      recipient_address: order.address,
      cod_amount:        codAmount,
      note:              order.note || "",
    },
    {
      headers: {
        "Api-Key":    settings.steadfastApiKey,
        "Secret-Key": settings.steadfastSecretKey,
        "Content-Type": "application/json",
      },
    }
  );
  return data?.consignment?.consignment_id || data?.consignment_id || "";
}

async function steadfastGetStatus(settings, consignmentId) {
  const { data } = await axios.get(
    `https://portal.packzy.com/api/v1/status_by_cid/${consignmentId}`,
    {
      headers: {
        "Api-Key":    settings.steadfastApiKey,
        "Secret-Key": settings.steadfastSecretKey,
      },
    }
  );
  return data?.delivery_status || "";
}

async function steadfastUpdateNote(settings, consignmentId, note) {
  await axios.post(
    `https://portal.packzy.com/api/v1/update_order/${consignmentId}`,
    { note },
    {
      headers: {
        "Api-Key":    settings.steadfastApiKey,
        "Secret-Key": settings.steadfastSecretKey,
        "Content-Type": "application/json",
      },
    }
  );
}

// ── Pathao API helpers ─────────────────────────────────────────────────────

async function pathaoGetToken(settings) {
  const { data } = await axios.post(
    "https://merchant.pathao.com/aladdin/api/v1/issue-token",
    {
      client_id:     settings.pathaoApiKey,
      client_secret: settings.pathaoSecretKey,
      grant_type:    "client_credentials",
    }
  );
  return data?.access_token || "";
}

async function pathaoCreateConsignment(settings, order) {
  const token = await pathaoGetToken(settings);
  const codAmount = order.paymentMethod === "cod"
    ? (order.amount + order.deliveryCharge - order.discount)
    : 0;

  const { data } = await axios.post(
    "https://merchant.pathao.com/aladdin/api/v1/orders",
    {
      store_id:          1,
      merchant_order_id: order.orderId,
      recipient_name:    order.customerName,
      recipient_phone:   order.mobile,
      recipient_address: order.address,
      recipient_city:    order.deliveryZone === "inside_dhaka" ? 1 : 2,
      delivery_type:     48,
      item_quantity:     order.quantity,
      item_weight:       0.5,
      amount_to_collect: codAmount,
      special_instruction: order.note || "",
    },
    { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
  );
  return data?.data?.consignment_id || "";
}

// ── Map courier status → our status ───────────────────────────────────────

function mapCourierStatus(rawStatus) {
  const s = (rawStatus || "").toLowerCase();
  if (["delivered"].includes(s))                          return "delivered";
  if (["cancelled", "returned", "return"].includes(s))    return "pending_return";
  return null; // no change needed
}

export function mapTrackingLabel(rawStatus) {
  const s = (rawStatus || "").toLowerCase();
  if (!s)                                                 return "Processing";
  if (["pending", "in_review"].includes(s))               return "Parcel Received by Courier";
  if (s === "in_warehouse")                               return "In Warehouse";
  if (["out_for_delivery", "dispatched"].includes(s))     return "Out for Delivery";
  if (["partially_delivered", "rider_assigned"].includes(s)) return "Rider Assigned for Delivery";
  if (s === "delivered")                                  return "Delivered";
  if (["cancelled", "returned", "return"].includes(s))    return "Pending Return";
  return rawStatus;
}

// ── POST /api/admin/orders/:id/ship ───────────────────────────────────────
// Creates consignment in courier, saves consignmentId to order

export async function shipOrder(req, res) {
  const order = await Order.findById(req.params.id).populate("bloc");
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.status === "shipped") return res.status(400).json({ message: "Already shipped" });

  const settings = await CourierSettings.getSingleton();
  const courier = req.body.courierName || settings.defaultCourier;

  let consignmentId = "";
  try {
    if (courier === "steadfast" && settings.steadfastEnabled) {
      consignmentId = await steadfastCreateConsignment(settings, order, order.bloc);
    } else if (courier === "pathao" && settings.pathaoEnabled) {
      consignmentId = await pathaoCreateConsignment(settings, order);
    }
  } catch (err) {
    return res.status(502).json({ message: "Courier API error: " + (err.response?.data?.message || err.message) });
  }

  order.status        = "shipped";
  order.courierName   = courier;
  order.consignmentId = consignmentId;
  await order.save();

  res.json(order);
}

// ── PUT /api/admin/orders/:id/note ────────────────────────────────────────
// Updates note and syncs to courier if already shipped

export async function updateOrderNote(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  order.note = req.body.note || "";
  await order.save();

  // Sync note to courier if shipped
  if (order.status === "shipped" && order.consignmentId) {
    const settings = await CourierSettings.getSingleton();
    try {
      if (order.courierName === "steadfast" && settings.steadfastEnabled) {
        await steadfastUpdateNote(settings, order.consignmentId, order.note);
      }
    } catch (_) { /* non-fatal */ }
  }

  res.json(order);
}

// ── Background sync — called on server wake ────────────────────────────────
// Checks all shipped orders. Skips if synced within last 1 hour.

let lastGlobalSync = null;

async function runSync() {
  const ONE_HOUR = 60 * 60 * 1000;
  if (lastGlobalSync && Date.now() - lastGlobalSync < ONE_HOUR) return { skipped: true };
  lastGlobalSync = Date.now();

  const settings = await CourierSettings.getSingleton();
  const shipped = await Order.find({ status: "shipped", consignmentId: { $ne: "" } });

  let updated = 0;
  for (const order of shipped) {
    try {
      let rawStatus = "";
      if (order.courierName === "steadfast" && settings.steadfastEnabled) {
        rawStatus = await steadfastGetStatus(settings, order.consignmentId);
      }
      const newStatus = mapCourierStatus(rawStatus);
      if (newStatus && newStatus !== order.status) {
        order.status         = newStatus;
        order.trackingStatus = rawStatus;
        order.lastCourierSync = new Date();
        await order.save();
        updated++;
      } else if (rawStatus) {
        order.trackingStatus  = rawStatus;
        order.lastCourierSync = new Date();
        await order.save();
      }
    } catch (_) { /* skip failed individual orders */ }
  }
  return { synced: shipped.length, updated };
}

export async function syncCourierStatuses(req, res) {
  const result = await runSync();
  if (res) res.json(result);
}
