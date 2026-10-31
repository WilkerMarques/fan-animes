import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { emptyPagesPixelForm } from "../home/landingPages";
import { PixelConfigSection } from "./PixelConfigSection";

function adminPagesBody(overrides = {}) {
  const form = emptyPagesPixelForm();
  for (const [pageKey, providers] of Object.entries(overrides)) {
    form[pageKey] = { ...form[pageKey], ...providers };
  }
  return {
    pages: Object.fromEntries(
      Object.entries(form).map(([pageKey, providers]) => [
        pageKey,
        {
          providers: Object.fromEntries(
            Object.entries(providers).map(([providerKey, slots]) => [
              providerKey,
              {
                slots: slots.map((slot, index) => ({
                  slot: index + 1,
                  pixelId: slot.pixelId,
                  active: slot.active,
                })),
              },
            ])
          ),
          updatedAt: null,
          updatedBy: null,
        },
      ])
    ),
  };
}

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

  test("loads Meta configuration and supports OpenAI tabs", async () => {
    const form = emptyPagesPixelForm();
    form.home.meta[0] = { slot: 1, pixelId: "1736644321794726", active: true };
    mockFetchSequence([
      {
        match: "dashboard-pixel-config",
        method: "GET",
        status: 200,
        body: adminPagesBody({ home: form.home }),
      },
    ]);

    render(<PixelConfigSection onUnauthorized={jest.fn()} />);
    await waitFor(() => expect(screen.getByDisplayValue("1736644321794726")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /ChatGPT \/ OpenAI/ }));
    expect(screen.getAllByPlaceholderText(/MCJXHhHwXwLQLYxMWbCEAs/).length).toBe(5);
  });

  test("rejects an invalid ID", async () => {
    const form = emptyPagesPixelForm();
    form.home.meta[0] = { slot: 1, pixelId: "1736644321794726", active: true };
    mockFetchSequence([
      {
        match: "dashboard-pixel-config",
        method: "GET",
        status: 200,
        body: adminPagesBody({ home: form.home }),
      },
    ]);

    render(<PixelConfigSection onUnauthorized={jest.fn()} />);
    const input = await screen.findByDisplayValue("1736644321794726");
    await userEvent.clear(input);
    await userEvent.type(input, "<script>x</script>");
    expect(screen.getByRole("button", { name: "Salvar configuração" })).toBeDisabled();
    expect(screen.getByText(/ID inválido/)).toBeInTheDocument();
  });
});
