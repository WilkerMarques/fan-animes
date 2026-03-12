import {
  createSessionToken,
  buildSessionCookie,
} from "./_lib/session.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { password } = req.body || {};
    const expectedPassword = process.env.DASHBOARD_PASSWORD;

    if (!expectedPassword) {
      return res.status(500).json({ error: "Senha do dashboard não configurada" });
    }

    if (!password || password !== expectedPassword) {
      return res.status(401).json({ error: "Senha inválida" });
    }

    const token = createSessionToken();

    res.setHeader("Set-Cookie", buildSessionCookie(token));
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ error: "Erro interno no login" });
  }
}