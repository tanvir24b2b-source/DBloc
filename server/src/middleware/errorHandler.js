export function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.statusCode || err.status || 500;
  const isProd = process.env.NODE_ENV === "production";
  const message = isProd && status === 500 ? "Internal server error" : (err.message || "Server error");
  res.status(status).json({ message });
}
