import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protect(req, res, next) {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });
    if (user.banned) return res.status(403).json({ message: "Account banned" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

const STAFF_ROLES = ["moderator", "subadmin", "admin", "master_admin"];

export function isAdmin(req, res, next) {
  if (!STAFF_ROLES.includes(req.user?.role)) {
    return res.status(403).json({ message: "Staff access required" });
  }
  next();
}

export function isMasterAdmin(req, res, next) {
  if (req.user?.role !== "master_admin") {
    return res.status(403).json({ message: "Master admin access required" });
  }
  next();
}
