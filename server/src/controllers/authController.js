import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { signAccessToken, signRefreshToken, cookieOptions } from "../utils/tokens.js";

function publicUser(u) {
  return { _id: u._id, name: u.name, email: u.email, mobile: u.mobile, address: u.address, role: u.role, permissions: u.permissions || [] };
}

export async function register(req, res) {
  const { name, email, password, mobile, address } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "Name, email, and password are required" });
  if (password.length < 8)
    return res.status(400).json({ message: "Password must be at least 8 characters" });

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ message: "Email already registered" });

  const user = await User.create({ name, email, password, mobile, address });
  const accessToken = signAccessToken(user);
  res.cookie("refreshToken", signRefreshToken(user), cookieOptions);
  res.status(201).json({ user: publicUser(user), accessToken });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ message: "Invalid email or password" });
  if (user.banned) return res.status(403).json({ message: "Account banned" });

  const accessToken = signAccessToken(user);
  res.cookie("refreshToken", signRefreshToken(user), cookieOptions);
  res.json({ user: publicUser(user), accessToken });
}

export async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

export async function logout(req, res) {
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
    const accessToken = signAccessToken(user);
    res.cookie("refreshToken", signRefreshToken(user), cookieOptions);
    res.json({ accessToken, user: publicUser(user) });
  } catch {
    res.status(401).json({ message: "Refresh token expired, please log in again" });
  }
}

// Customer-only password reset. No email service in this setup, so identity is
// verified by matching email + registered mobile number on a customer account.
export async function forgotPassword(req, res) {
  const { email, mobile, newPassword } = req.body;
  if (!email || !mobile || !newPassword)
    return res.status(400).json({ message: "Email, mobile number, and new password are required" });
  if (newPassword.length < 8)
    return res.status(400).json({ message: "Password must be at least 8 characters" });

  // Only customers (role "user") can self-reset. Staff/admin accounts are excluded.
  // Use a consistent error message to prevent email/mobile enumeration.
  const user = await User.findOne({ email: email.toLowerCase().trim(), role: "user" }).select("+password");
  if (!user || user.mobile?.trim() !== mobile.trim())
    return res.status(404).json({ message: "No account matches that email and mobile number" });

  user.password = newPassword;
  await user.save();
  res.json({ message: "Password reset successful. You can now log in." });
}

export async function updateProfile(req, res) {
  const { name, email, mobile, address, password, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");
  if (!user) return res.status(404).json({ message: "User not found" });

  if (name) user.name = name.trim();
  if (email) user.email = email.toLowerCase().trim();
  if (mobile !== undefined) user.mobile = mobile;
  if (address !== undefined) user.address = address;

  if (newPassword) {
    if (!password) return res.status(400).json({ message: "Current password required to set a new one" });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: "Current password is incorrect" });
    user.password = newPassword;
  }

  await user.save();
  res.json({ user: publicUser(user) });
}
