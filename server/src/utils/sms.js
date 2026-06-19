import SmsSettings from "../models/SmsSettings.js";

function fillTemplate(template, vars) {
  return Object.entries(vars).reduce(
    (t, [k, v]) => t.replaceAll(`{{${k}}}`, v ?? ""),
    template
  );
}

export async function sendSms(to, templateKey, vars = {}) {
  const settings = await SmsSettings.findById("sms");
  if (!settings?.enabled || !settings.apiKey || !settings.apiUrl) return;

  const template = settings.templates?.[templateKey];
  if (!template) return;

  const message = fillTemplate(template, vars);

  // Normalize BD number: strip +880 prefix → use raw number for most BD gateways
  const number = to.replace(/^\+880/, "0");

  const params = new URLSearchParams({
    [settings.apiKeyField || "apikey"]: settings.apiKey,
    [settings.senderField || "senderid"]: settings.senderId,
    [settings.numberField || "number"]: number,
    [settings.messageField || "message"]: message,
  });

  try {
    // NOTE: BD SMS providers (e.g. BulkSMSBD, Mimsms) require GET with API key in query string.
    // This is a provider limitation — rotate the API key periodically to reduce exposure risk.
    const url = `${settings.apiUrl.replace(/\/$/, "")}?${params.toString()}`;
    await fetch(url);
  } catch (err) {
    console.error("[SMS] Failed to send:", err.message);
  }
}
