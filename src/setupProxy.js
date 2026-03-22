/**
 * Só encaminha /api para o PHP local (npm run api:local).
 * Evita que o proxy global mande arquivos do HMR (*.hot-update.json) para :8080.
 */
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function setupProxy(app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:8080",
      changeOrigin: true,
    })
  );
};
