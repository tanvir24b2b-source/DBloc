import jwt from "jsonwebtoken";
import xss from "xss";
import User from "../models/User.js";
import { signAccessToken, signRefreshToken, cookieOptions } from "../utils/tokens.js";

function publicUser(u) {
  return { _id: u._id, name: u.name, email: u.email, mobile: u.mobile, address: u.address, role: u.role, permissions: u.permissions || [], lastLoginAt: u.lastLoginAt };
}

export async function register(req, res) {
  const { name, email, password, mobile, address } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "Name, email, and password are required" });
  if (password.length < 8)
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Invalid email address" });
  }
  if (mobile && !/^01[0-9]{9}$/.test(mobile)) {
    return res.status(400).json({ message: "Mobile must be an 11-digit Bangladeshi number (01XXXXXXXXX)" });
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ message: "Email already registered" });

  const user = await User.create({ name: xss(name), email, password, mobile, address: address ? xss(address) : address });
  const accessToken = signAccessToken(user);
  res.cookie("refreshToken", signRefreshToken(user), cookieOptions);
  res.status(201).json({ user: publicUser(user), accessToken });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (typeof email !== "string" || typeof password !== "string")
    return res.status(400).json({ message: "Invalid email or password" });
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ message: "Invalid email or password" });
  if (user.banned) return res.status(403).json({ message: "Account banned" });

  user.lastLoginAt = new Date();
  user.lastLoginIP = req.ip || "unknown";
  await user.save({ validateModifiedOnly: true });

  const accessToken = signAccessToken(user);
  res.cookie("refreshToken", signRefreshToken(user), cookieOptions);
  res.json({ user: publicUser(user), accessToken });
}

export async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

export async function logout(req, res) {
  // Bump tokenVersion so the just-issued refresh token can no longer be used.
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      await User.findByIdAndUpdate(decoded.id, { $inc: { tokenVersion: 1 } });
    } catch { /* expired/invalid token — nothing to revoke */ }
  }
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
}

export async function refresh(req, res) {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: "No refresh token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.banned) return res.status(401).json({ message: "Invalid session" });
    if ((decoded.tv || 0) !== (user.tokenVersion || 0)) {
      res.clearCookie("refreshToken");
      return res.status(401).json({ message: "Session revoked, please log in again" });
    }
    const accessToken = signAccessToken(user);
    res.cookie("refreshToken", signRefreshToken(user), cookieOptions);
    res.json({ accessToken, user: publicUser(user) });
  } catch {
    res.status(401).json({ message: "Refresh token expired, please log in again" });
  }
}

// Step 1: Customer requests OTP — verifies email + mobile ownership before allowing reset.
export async function forgotPassword(req, res) {
  const { email, mobile } = req.body;
  if (typeof email !== "string" || typeof mobile !== "string")
    return res.status(400).json({ message: "Email and mobile number are required" });

  const { randomInt } = await import("crypto");
  // Always generate an OTP (constant-time — don't reveal whether user exists)
  const otp = String(randomInt(100000, 999999));
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const user = await User.findOne({ email: email.toLowerCase().trim(), role: "user" }).select("+resetOtp +resetOtpExpiry");
  const mobileMatch = user ? (user.mobile?.trim() === mobile.trim()) : false;

  if (user && mobileMatch) {
    user.resetOtp = otp;
    user.resetOtpExpiry = expiry;
    await user.save({ validateModifiedOnly: true });
    const { sendSms } = await import("../utils/sms.js");
    sendSms(mobile, "passwordResetOtp", { otp });
  }

  // Same response whether or not account exists — prevents enumeration
  res.json({ message: "If an account with those details exists, an OTP has been sent to your mobile." });
}

// Step 2: Customer submits OTP + new password.
export async function resetPasswordWithOtp(req, res) {
  const { email, otp, newPassword } = req.body;
  if (typeof email !== "string" || typeof otp !== "string" || typeof newPassword !== "string")
    return res.status(400).json({ message: "Email, OTP, and new password are required" });
  if (newPassword.length < 8)
    return res.status(400).json({ message: "Password must be at least 8 characters" });

  const user = await User.findOne({ email: email.toLowerCase().trim(), role: "user" }).select("+password +resetOtp +resetOtpExpiry");
  if (!user || !user.resetOtp || user.resetOtp !== otp.trim() || !user.resetOtpExpiry || user.resetOtpExpiry < new Date()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  user.password = newPassword;
  user.resetOtp = undefined;
  user.resetOtpExpiry = undefined;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
  res.json({ message: "Password reset successful. You can now log in." });
}

export async function updateProfile(req, res) {
  const { name, email, mobile, address, password, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");
  if (!user) return res.status(404).json({ message: "User not found" });

  if (name) user.name = xss(name.trim());
  if (email) user.email = email.toLowerCase().trim();
  if (mobile !== undefined) {
    if (mobile && !/^01[0-9]{9}$/.test(mobile)) {
      return res.status(400).json({ message: "Mobile must be an 11-digit Bangladeshi number (01XXXXXXXXX)" });
    }
    user.mobile = mobile;
  }
  if (address !== undefined) user.address = xss(address);

  if (newPassword) {
    if (!password) return res.status(400).json({ message: "Current password required to set a new one" });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: "Current password is incorrect" });
    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1; // revoke existing sessions
  }

  await user.save();
  res.json({ user: publicUser(user) });
}
