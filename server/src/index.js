import "dotenv/config";
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

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error("✗ JWT_SECRET and JWT_REFRESH_SECRET must be set in .env. Refusing to start.");
  process.exit(1);
}

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

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
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", resetLimiter);
app.post("/api/orders", orderLimiter);

app.use("/uploads", express.static(new URL("../public/images", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")));
app.get("/api/health", (req, res) => res.json({ status: "ok", service: "D BLOC API" }));
app.use("/api", routes);

// robots.txt and MCP server (top-level, no /api prefix)
app.get("/robots.txt", (req, res, next) => getRobots(req, res, next).catch(next));
app.post("/mcp", (req, res, next) => mcpHandler(req, res, next).catch(next));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => ensureSeeded())
  .then(() => seedGateways())
  .then(() => {
    app.listen(PORT, () => console.log(`✓ D BLOC API running on http://localhost:${PORT}`));
  });
 
 
 
