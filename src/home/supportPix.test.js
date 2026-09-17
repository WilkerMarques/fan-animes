import { parseSupportAmount, requestPixCopiaCola, supportPixConnectError } from "./supportPix";

test("parses Brazilian currency values", () => {
  expect(parseSupportAmount("15,00")).toBe(15);
  expect(parseSupportAmount("15,50")).toBe(15.5);
  expect(parseSupportAmount("R$ 10")).toBe(10);
});

test("rejects empty or invalid amounts", () => {
  expect(() => parseSupportAmount("")).toThrow("Informe um valor em reais.");
  expect(() => parseSupportAmount("abc")).toThrow("Valor inválido. Use por exemplo 15,00.");
  expect(() => parseSupportAmount("0")).toThrow("Valor inválido. Use por exemplo 15,00.");
  expect(() => parseSupportAmount("1000000")).toThrow("Valor deve ser até 999999.99.");
});

test("requests the Pix payload for the given amount", async () => {
  const apiFetch = jest.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ copiaCola: "00020126fan-animes-pix" }),
  }));

  await expect(
    requestPixCopiaCola({ apiFetch, apiBase: "", valor: 15 })
  ).resolves.toBe("00020126fan-animes-pix");
  expect(apiFetch).toHaveBeenCalledWith("/api/pix-copia-cola?valor=15");
});

test("propagates API errors", async () => {
  const apiFetch = jest.fn(async () => ({
    ok: false,
    status: 503,
    json: async () => ({
      error: "Pix não configurado. Adicione pix_chave_aleatoria em config.local.php com sua chave Pix (Inter).",
    }),
  }));

  await expect(
    requestPixCopiaCola({ apiFetch, apiBase: "", valor: 10 })
  ).rejects.toThrow("Pix não configurado. Adicione pix_chave_aleatoria em config.local.php com sua chave Pix (Inter).");
});

test("maps a network failure to a connection error", () => {
  expect(supportPixConnectError(new TypeError("Failed to fetch"))).toBe(
    "Erro ao conectar. Verifique a API."
  );
});
