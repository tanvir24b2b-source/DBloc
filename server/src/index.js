import "dotenv/config";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import { ensureSeeded } from "./seedData.js";
import { seedGateways } from "./controllers/paymentGatewayController.js";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { getRobots } from "./controllers/seoController.js";
import { mcpHandler } from "./controllers/mcpController.js";
import { syncCourierStatuses } from "./controllers/courierController.js";

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error("✗ JWT_SECRET and JWT_REFRESH_SECRET must be set in .env. Refusing to start.");
  process.exit(1);
}
if (process.env.NODE_ENV === "production" && (!process.env.CLIENT_URL || process.env.CLIENT_URL === "*")) {
  console.error("✗ CLIENT_URL must be set to a specific origin in production. Refusing to start.");
  process.exit(1);
}

const app = express();

// Trust the first proxy hop (Render's load balancer) so req.ip is the real client IP
app.set("trust proxy", 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc:    ["'self'", "https:"],
      objectSrc:  ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use((req, res, next) => {
  // Admin image uploads (base64) need a larger body; everything else stays small
  const isImageUpload =
    (req.method === "PUT" && /^\/api\/content\//.test(req.path)) ||
    (req.method === "POST" && /^\/api\/content\/bulk/.test(req.path));
  express.json({ limit: isImageUpload ? "10mb" : "200kb" })(req, res, next);
});
app.use(cookieParser());
// Ensure all JSON responses declare UTF-8 charset — prevents encoding boxes (e.g. × showing as □)
app.use((req, res, next) => {
  const orig = res.json.bind(res);
  res.json = (body) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return orig(body);
  };
  next();
});

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: "Too many attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});
const orderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { message: "Too many orders placed. Please wait a moment." },
  standardHeaders: true,
  legacyHeaders: false,
});
// Stricter limit on password reset — guards the email+mobile takeover vector
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { message: "Too many reset attempts. Please try again in an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});
// Guards the public order-tracking endpoint against sequential orderId enumeration
const trackLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  message: { message: "Too many tracking requests. Please wait a moment." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", resetLimiter);
app.use("/api/auth/reset-password", resetLimiter);
app.get("/api/orders/track", trackLimiter);
app.post("/api/orders", orderLimiter);

app.use("/uploads", express.static(new URL("../public/images", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")));
app.get("/api/health", (req, res) => res.json({ status: "ok", service: "D BLOC API" }));

app.use("/api", routes);

// robots.txt and MCP server (top-level, no /api prefix)
const mcpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { message: "Too many MCP requests." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/robots.txt", (req, res, next) => getRobots(req, res, next).catch(next));
app.post("/mcp", mcpLimiter, (req, res, next) => mcpHandler(req, res, next).catch(next));

// Serve React frontend static files in production
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const clientDist = join(__dirname, "../../../client/dist");
app.use(express.static(clientDist));
app.get("*", (req, res) => {
  res.sendFile(join(clientDist, "index.html"));
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => ensureSeeded())
  .then(() => seedGateways())
  .then(() => {
    app.listen(PORT, () => console.log(`✓ D BLOC API running on http://localhost:${PORT}`));
    // Sync courier statuses once on startup, then every hour (cooldown also enforced inside)
    syncCourierStatuses(null, null).catch(() => {});
    setInterval(() => syncCourierStatuses(null, null).catch(() => {}), 60 * 60 * 1000);
  });

