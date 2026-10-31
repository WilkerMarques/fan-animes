import { emptyPagesPixelForm } from "./landingPages";
import {
  fetchAdminPixelConfig,
  fetchPublicPixelConfig,
  normalizePublicPixelConfig,
  saveAdminPixelPages,
} from "./pixelConfigApi";

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

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

describe("pixelConfigApi", () => {
  test("normalizes public config for Meta and OpenAI", () => {
    expect(
      normalizePublicPixelConfig({
        page: "rap",
        meta: { pixelIds: ["1736644321794726"] },
        openai: { pixelIds: ["MCJXHhHwXwLQLYxMWbCEAs"] },
      })
    ).toEqual({
      page: "rap",
      meta: { pixelIds: ["1736644321794726"] },
      openai: { pixelIds: ["MCJXHhHwXwLQLYxMWbCEAs"] },
    });
  });

  test("reads the public configuration for a page", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse(200, {
        page: "rap",
        meta: { pixelIds: ["1736644321794726"] },
        openai: { pixelIds: ["MCJXHhHwXwLQLYxMWbCEAs"] },
      })
    );
    await expect(fetchPublicPixelConfig("rap", fetchImpl)).resolves.toEqual({
      page: "rap",
      meta: { pixelIds: ["1736644321794726"] },
      openai: { pixelIds: ["MCJXHhHwXwLQLYxMWbCEAs"] },
    });
  });

  test("loads the admin configuration when authorized", async () => {
    const form = emptyPagesPixelForm();
    form.home.meta[0] = { slot: 1, pixelId: "1736644321794726", active: true };
    form.home.openai[0] = { slot: 1, pixelId: "MCJXHhHwXwLQLYxMWbCEAs", active: true };
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(200, adminPagesBody({ home: form.home })));
    const result = await fetchAdminPixelConfig(fetchImpl);
    expect(result.data.pages.home.providers.meta.slots[0].pixelId).toBe("1736644321794726");
    expect(result.data.pages.home.providers.openai.slots[0].pixelId).toBe("MCJXHhHwXwLQLYxMWbCEAs");
  });

  test("saves admin page configurations", async () => {
    const form = emptyPagesPixelForm();
    form.home.meta[0] = { slot: 1, pixelId: "1111111111111111", active: false };
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(200, adminPagesBody({ home: form.home })));
    const result = await saveAdminPixelPages(form, fetchImpl);
    expect(result.data.pages.home.providers.meta.slots[0].pixelId).toBe("1111111111111111");
    const payload = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(payload.pages.home.providers.openai.slots).toHaveLength(5);
  });
});
