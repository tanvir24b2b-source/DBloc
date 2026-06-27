import crypto from "crypto";
import SeoSettings from "../models/SeoSettings.js";

const hash = (val) => val ? crypto.createHash("sha256").update(val.trim().toLowerCase()).digest("hex") : undefined;

export async function sendCapiPurchase(order, bloc) {
  try {
    const seo = await SeoSettings.getSingleton();
    const pixelId = seo?.facebookPixelId;
    const token = seo?.facebookCapiToken;
    if (!pixelId || !token) return; // not configured — skip silently

    const userData = {};
    if (order.email) userData.em = [hash(order.email)];
    if (order.mobile) userData.ph = [hash(order.mobile)];

    const payload = {
      data: [{
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: String(order._id),
        action_source: "website",
        user_data: userData,
        custom_data: {
          currency: "BDT",
          value: order.amount,
          order_id: order.orderId || String(order._id),
          content_name: bloc?.title,
          content_ids: [String(bloc?._id)],
          content_type: "product",
          num_items: order.quantity,
        },
      }],
    };

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
    );
    if (!res.ok) {
      const err = await res.text();
      console.error("[Meta CAPI] error:", err);
    }
  } catch (e) {
    console.error("[Meta CAPI] failed:", e.message);
  }
}
