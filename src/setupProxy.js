/**
 * Nur für „npm start“: leitet API-Routen zum Flask-Backend weiter.
 * Target fest auf IPv4 — vermeidet ::1/localhost-Ambiguität mit Flask auf 0.0.0.0.
 * Port wie backend/server.py (Standard 5001).
 */
const { createProxyMiddleware } = require("http-proxy-middleware");

/** Optional: PROXY_TARGET=http://127.0.0.1:5001 npm start */
const BACKEND = process.env.PROXY_TARGET || "http://127.0.0.1:5001";

module.exports = function setupProxy(app) {
  app.use(
    createProxyMiddleware(
      ["/search", "/health", "/competency-chain", "/competency-network", "/api"],
      {
        target: BACKEND,
        changeOrigin: true,
      }
    )
  );
};
