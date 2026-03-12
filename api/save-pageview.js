export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Supabase não configurado" });
    }

    const { page, device } = req.body || {};
    const allowedDevices = ["mobile", "desktop"];

    if (
      typeof page !== "string" ||
      !page.trim() ||
      page.trim().length > 80 ||
      !allowedDevices.includes(device)
    ) {
      return res.status(400).json({ error: "Payload inválido" });
    }

    const payload = {
      page: page.trim(),
      device,
      viewed_at: new Date().toISOString(),
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/pageviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Erro Supabase save-pageview:", text);
      return res.status(500).json({ error: "Erro ao salvar pageview" });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Erro save-pageview:", error);
    return res.status(500).json({ error: "Erro interno ao salvar pageview" });
  }
}
