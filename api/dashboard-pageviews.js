import { isAuthenticated } from "./_lib/session.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Supabase não configurado" });
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/pageviews?select=*&order=viewed_at.desc&limit=1000`,
      {
        method: "GET",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("Erro Supabase dashboard-pageviews:", text);
      return res.status(500).json({ error: "Erro ao consultar pageviews" });
    }

    const data = await response.json();
    return res.status(200).json(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Erro dashboard-pageviews:", error);
    return res.status(500).json({ error: "Erro interno no dashboard" });
  }
}

