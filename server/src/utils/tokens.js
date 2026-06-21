import jwt from "jsonwebtoken";

export function signAccessToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, permissions: user.permissions, tv: user.tokenVersion || 0 },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
}

export function signRefreshToken(user) {
  return jwt.sign({ id: user._id, tv: user.tokenVersion || 0 }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "30d",
  });
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};
