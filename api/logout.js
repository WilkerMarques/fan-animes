import { buildLogoutCookie } from "./_lib/session.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  res.setHeader("Set-Cookie", buildLogoutCookie());
  return res.status(200).json({ ok: true });
}