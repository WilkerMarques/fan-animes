export function parseSupportAmount(raw) {
  const text = String(raw ?? "").trim();
  if (!text) {
    throw new Error("Informe um valor em reais.");
  }
  const withoutCurrency = text.replace(/R\$\s*/i, "").replace(/\s/g, "");
  const normalized = withoutCurrency.replace(",", ".");
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Valor inválido. Use por exemplo 15,00.");
  }
  if (amount > 999999.99) {
    throw new Error("Valor deve ser até 999999.99.");
  }
  return amount;
}

export async function requestPixCopiaCola({ apiFetch, apiBase, valor }) {
  const amount = Number(valor);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Valor inválido. Use por exemplo 15,00.");
  }
  const res = await apiFetch(`${apiBase}/api/pix-copia-cola?valor=${encodeURIComponent(amount)}`);
  if (res.status === 429) {
    throw new Error("Muitas requisições em pouco tempo. Tente novamente em alguns instantes.");
  }
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Resposta inválida do servidor.");
  }
  if (!res.ok || data.error) {
    throw new Error(data.error || "Não foi possível gerar o Pix. Configure o backend.");
  }
  const copia = (data.copiaCola || data.copia_cola || "").trim();
  if (!copia) {
    throw new Error("Resposta inválida do servidor.");
  }
  return copia;
}

export function supportPixConnectError(error) {
  if (error instanceof TypeError) {
    return "Erro ao conectar. Verifique a API.";
  }
  return error.message || "Não foi possível gerar o Pix.";
}
