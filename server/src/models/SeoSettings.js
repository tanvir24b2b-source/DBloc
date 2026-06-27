import mongoose from "mongoose";
import crypto from "crypto";

const seoSchema = new mongoose.Schema({
  // Global SEO
  siteTitle: { type: String, default: "D BLOC — Buy Together, Save More" },
  siteDescription: { type: String, default: "Bangladesh's group-buy platform. Buy together, pay wholesale." },
  siteKeywords: { type: String, default: "group buy, wholesale, Bangladesh, deals, D BLOC" },
  ogImage: { type: String, default: "" },
  canonicalUrl: { type: String, default: "" },

  // Analytics & tracking
  googleTagManagerId: { type: String, default: "" },  // GTM-XXXXXXX (preferred — manages GA4, FB, etc.)
  googleAnalyticsId: { type: String, default: "" },   // G-XXXXXXXXXX (direct, if not using GTM)
  googleSearchConsoleCode: { type: String, default: "" },
  facebookPixelId: { type: String, default: "" },
  facebookCapiToken: { type: String, default: "" },
  facebookTestEventCode: { type: String, default: "" }, // e.g. TEST12345 — for Meta Events Manager testing
  facebookApiVersion: { type: String, default: "v21.0" }, // update when Meta releases new version
  // Per-event toggles: browser (pixel) + server (CAPI)
  metaEvents: {
    viewContent:       { browser: { type: Boolean, default: true }, server: { type: Boolean, default: false } },
    addToCart:         { browser: { type: Boolean, default: true }, server: { type: Boolean, default: false } },
    initiateCheckout:  { browser: { type: Boolean, default: true }, server: { type: Boolean, default: false } },
    purchase:          { browser: { type: Boolean, default: true }, server: { type: Boolean, default: true  } },
    lead:              { browser: { type: Boolean, default: false }, server: { type: Boolean, default: false } },
  },
  // Last 20 CAPI event logs
  metaEventLog: { type: Array, default: [] },

  // Robots
  robotsTxt: { type: String, default: "User-agent: *\nAllow: /\nDisallow: /admin/\n" },

  // Claude Code MCP token — no API key needed, uses user's Claude subscription
  mcpToken: { type: String, default: "" },

  // AI subscription connection status (set manually by master_admin)
  aiClaudeConnected:  { type: Boolean, default: false },
  aiChatGPTConnected: { type: Boolean, default: false },
  aiGeminiConnected:  { type: Boolean, default: false },
  aiOtherConnected:   { type: Boolean, default: false },
  aiOtherName:        { type: String,  default: "" },
}, { timestamps: true });

seoSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

seoSchema.statics.generateMcpToken = async function () {
  const doc = await this.getSingleton();
  doc.mcpToken = crypto.randomBytes(32).toString("hex");
  await doc.save();
  return doc.mcpToken;
};

export default mongoose.model("SeoSettings", seoSchema);
