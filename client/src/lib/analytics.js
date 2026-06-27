// Unified analytics: GTM dataLayer (all platforms) + FB Pixel direct (browser side)
// Server side (CAPI) is handled by server/src/utils/metaCapi.js after each order

const dl = () => (window.dataLayer = window.dataLayer || []);
const fbq = (...args) => typeof window.fbq === "function" && window.fbq(...args);

export function trackViewContent(bloc, currency = "BDT") {
  dl().push({ event: "view_item", ecommerce: { currency, value: bloc.blocPrice, items: [item(bloc, 1)] } });
  fbq("track", "ViewContent", { content_ids: [bloc._id], content_name: bloc.title, content_type: "product", value: bloc.blocPrice, currency });
}

export function trackAddToCart(bloc, qty, currency = "BDT") {
  dl().push({ event: "add_to_cart", ecommerce: { currency, value: bloc.blocPrice * qty, items: [item(bloc, qty)] } });
  fbq("track", "AddToCart", { content_ids: [bloc._id], content_name: bloc.title, content_type: "product", value: bloc.blocPrice * qty, currency, num_items: qty });
}

export function trackInitiateCheckout(bloc, qty, currency = "BDT") {
  dl().push({ event: "begin_checkout", ecommerce: { currency, value: bloc.blocPrice * qty, items: [item(bloc, qty)] } });
  fbq("track", "InitiateCheckout", { content_ids: [bloc._id], content_name: bloc.title, value: bloc.blocPrice * qty, currency, num_items: qty });
}

export function trackPurchase(order, bloc, currency = "BDT") {
  dl().push({ event: "purchase", ecommerce: { transaction_id: order.orderId || order._id, currency, value: order.amount, items: [item(bloc, order.quantity)] } });
  fbq("track", "Purchase", { content_ids: [bloc._id], content_name: bloc.title, value: order.amount, currency, num_items: order.quantity });
}

export function trackLead(data = {}) {
  dl().push({ event: "generate_lead", ...data });
  fbq("track", "Lead");
}

function item(bloc, qty) {
  return { item_id: bloc._id, item_name: bloc.title, price: bloc.blocPrice, quantity: qty };
}
