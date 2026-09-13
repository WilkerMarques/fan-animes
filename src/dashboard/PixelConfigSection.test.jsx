import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PixelConfigSection } from "./PixelConfigSection";

function mockFetchSequence(handlers) {
  return jest.spyOn(global, "fetch").mockImplementation(async (url, options = {}) => {
    const method = options.method || "GET";
    const handler = handlers.find((item) => url.includes(item.match) && item.method === method);
    if (!handler) {
      return { ok: true, status: 200, json: async () => ({}) };
    }
    return {
      ok: handler.status >= 200 && handler.status < 300,
      status: handler.status,
      json: async () => handler.body,
    };
  });
}

describe("PixelConfigSection", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("loads the current configuration and disables save until it changes", async () => {
    mockFetchSequence([
      {
        match: "dashboard-pixel-config",
        method: "GET",
        status: 200,
        body: { pixelId: "1736644321794726", active: true },
      },
    ]);

    render(<PixelConfigSection onUnauthorized={jest.fn()} />);
    await waitFor(() => expect(screen.getByDisplayValue("1736644321794726")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Salvar configuração" })).toBeDisabled();
    expect(screen.getByText("ATIVO")).toBeInTheDocument();
  });

  test("rejects an invalid ID and asks before deactivating", async () => {
    mockFetchSequence([
      {
        match: "dashboard-pixel-config",
        method: "GET",
        status: 200,
        body: { pixelId: "1736644321794726", active: true },
      },
      {
        match: "dashboard-pixel-config",
        method: "POST",
        status: 200,
        body: { pixelId: "1736644321794726", active: false, updatedBy: "admin" },
      },
    ]);
    const confirmDeactivate = jest.fn().mockReturnValue(true);

    render(<PixelConfigSection onUnauthorized={jest.fn()} confirmDeactivate={confirmDeactivate} />);
    const input = await screen.findByDisplayValue("1736644321794726");

    await userEvent.clear(input);
    await userEvent.type(input, "fbq('init')");
    expect(screen.getByRole("button", { name: "Salvar configuração" })).toBeDisabled();
    expect(screen.getByText(/Scripts não são aceitos/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Cancelar/restaurar valor atual" }));
    await userEvent.click(screen.getByLabelText("Pixel ativo"));
    await userEvent.click(screen.getByRole("button", { name: "Salvar configuração" }));

    expect(confirmDeactivate).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText("Configuração do Pixel salva.")).toBeInTheDocument());
    expect(screen.getByText("INATIVO")).toBeInTheDocument();
  });

  test("sends an unauthorized admin back to login", async () => {
    const onUnauthorized = jest.fn();
    mockFetchSequence([
      {
        match: "dashboard-pixel-config",
        method: "GET",
        status: 401,
        body: { error: "Não autenticado" },
      },
    ]);

    render(<PixelConfigSection onUnauthorized={onUnauthorized} />);
    await waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
  });
});
