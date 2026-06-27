import SeoSettings from "../models/SeoSettings.js";

export async function getSettings(req, res) {
  const seo = await SeoSettings.getSingleton();
  const data = seo.toObject();
  delete data.mcpToken;
  delete data.facebookCapiToken;
  res.json(data);
}

export async function getSettingsAdmin(req, res) {
  const seo = await SeoSettings.getSingleton();
  const data = seo.toObject();
  // Mask sensitive fields
  data.mcpTokenSet = !!data.mcpToken;
  data.facebookCapiTokenSet = !!data.facebookCapiToken;
  delete data.mcpToken;
  res.json(data);
}

export async function updateSettings(req, res) {
  const seo = await SeoSettings.getSingleton();
  const allowed = [
    "siteTitle", "siteDescription", "siteKeywords", "ogImage", "canonicalUrl",
    "googleTagManagerId", "googleAnalyticsId", "googleSearchConsoleCode",
    "facebookPixelId", "facebookCapiToken", "facebookTestEventCode", "facebookApiVersion", "metaEvents",
    "aiClaudeConnected", "aiChatGPTConnected", "aiGeminiConnected", "aiOtherConnected", "aiOtherName",
  ];
  // robotsTxt is master_admin only
  if (req.user?.role === "master_admin" && req.body.robotsTxt !== undefined) {
    seo.robotsTxt = req.body.robotsTxt;
  }
  allowed.forEach((k) => { if (req.body[k] !== undefined) seo[k] = req.body[k]; });
  await seo.save();
  res.json({ message: "SEO settings saved" });
}

export async function generateMcpToken(req, res) {
  const token = await SeoSettings.generateMcpToken();
  res.json({ token });
}

export async function getRobots(req, res) {
  const seo = await SeoSettings.getSingleton();
  res.type("text/plain").send(seo.robotsTxt);
}
