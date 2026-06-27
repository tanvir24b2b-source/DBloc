import crypto from "crypto";
import bizSdk from "facebook-nodejs-business-sdk";
import SeoSettings from "../models/SeoSettings.js";

const { ServerEvent, EventRequest, UserData, CustomData, Content } = bizSdk;

const hash = (val) => val ? crypto.createHash("sha256").update(val.trim().toLowerCase()).digest("hex") : undefined;

async function getConfig() {
  const seo = await SeoSettings.getSingleton();
  return {
    pixelId: seo?.facebookPixelId,
    token: seo?.facebookCapiToken,
    testCode: seo?.facebookTestEventCode || null,
    apiVersion: seo?.facebookApiVersion || "v21.0",
    events: seo?.metaEvents || {},
    seo,
  };
}

async function logEvent(seo, entry) {
  const log = Array.isArray(seo.metaEventLog) ? seo.metaEventLog : [];
  seo.metaEventLog = [entry, ...log].slice(0, 20);
  await seo.save();
}

async function sendEvent({ eventName, order, bloc, extraCustomData = {} }) {
  try {
    const { pixelId, token, testCode, apiVersion, events, seo } = await getConfig();
    if (!pixelId || !token) return;

    // Check server toggle for this event
    const eventKey = {
      Purchase: "purchase",
      ViewContent: "viewContent",
      AddToCart: "addToCart",
      InitiateCheckout: "initiateCheckout",
      Lead: "lead",
    }[eventName];
    if (eventKey && events[eventKey]?.server === false) return;

    bizSdk.FacebookAdsApi.init(token);

    const userData = new UserData();
    if (order?.email) userData.setEmail(hash(order.email));
    if (order?.mobile) userData.setPhone(hash(order.mobile));

    const customData = new CustomData();
    customData.setCurrency("BDT");
    if (order?.amount) customData.setValue(order.amount);
    if (order?.orderId || order?._id) customData.setOrderId(String(order.orderId || order._id));
    if (order?.quantity) customData.setNumItems(order.quantity);
    if (bloc) {
      const content = new Content();
      content.setId(String(bloc._id));
      content.setTitle(bloc.title);
      content.setQuantity(order?.quantity || 1);
      content.setItemPrice(bloc.blocPrice);
      customData.setContents([content]);
      customData.setContentName(bloc.title);
      customData.setContentType("product");
    }
    Object.entries(extraCustomData).forEach(([k, v]) => customData[`set${k.charAt(0).toUpperCase()}${k.slice(1)}`]?.(v));

    const event = new ServerEvent();
    event.setEventName(eventName);
    event.setEventTime(Math.floor(Date.now() / 1000));
    event.setEventId(`${eventName}_${order?._id || Date.now()}`);
    event.setActionSource("website");
    event.setUserData(userData);
    event.setCustomData(customData);

    const req = new EventRequest(token, pixelId);
    req.setApiVersion(apiVersion);
    req.setEvents([event]);
    if (testCode) req.setTestEventCode(testCode);

    const result = await req.execute();
    await logEvent(seo, { event: eventName, status: "ok", time: new Date().toISOString(), eventsReceived: result?.events_received });
  } catch (e) {
    console.error(`[Meta CAPI] ${eventName} failed:`, e.message);
    try {
      const seo = await SeoSettings.getSingleton();
      await logEvent(seo, { event: eventName, status: "error", time: new Date().toISOString(), error: e.message });
    } catch {}
  }
}

export const sendCapiPurchase        = (order, bloc) => sendEvent({ eventName: "Purchase",         order, bloc });
export const sendCapiViewContent     = (order, bloc) => sendEvent({ eventName: "ViewContent",      order, bloc });
export const sendCapiAddToCart       = (order, bloc) => sendEvent({ eventName: "AddToCart",        order, bloc });
export const sendCapiInitiateCheckout= (order, bloc) => sendEvent({ eventName: "InitiateCheckout", order, bloc });
export const sendCapiLead            = (order)       => sendEvent({ eventName: "Lead",             order });
