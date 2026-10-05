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
  for (const [pageKey, slots] of Object.entries(overrides)) {
    form[pageKey] = slots;
  }
  return {
    pages: Object.fromEntries(
      Object.entries(form).map(([pageKey, slots]) => [
        pageKey,
        {
          slots: slots.map((slot, index) => ({
            slot: index + 1,
            pixelId: slot.pixelId,
            active: slot.active,
          })),
          updatedAt: null,
          updatedBy: null,
        },
      ])
    ),
  };
}

describe("pixelConfigApi", () => {
  test("normalizes a public config and ignores invalid IDs", () => {
    expect(normalizePublicPixelConfig({ page: "rap", pixelIds: ["1736644321794726"] })).toEqual({
      page: "rap",
      pixelIds: ["1736644321794726"],
    });
    expect(normalizePublicPixelConfig({ pixelIds: ["<script>"] })).toEqual({
      page: "home",
      pixelIds: [],
    });
    expect(normalizePublicPixelConfig({ pixelId: "1736644321794726", active: true })).toEqual({
      page: "home",
      pixelIds: ["1736644321794726"],
    });
  });

  test("reads the public configuration for a page", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse(200, { page: "rap", pixelIds: ["1736644321794726", "1111111111111111"] })
    );
    await expect(fetchPublicPixelConfig("rap", fetchImpl)).resolves.toEqual({
      page: "rap",
      pixelIds: ["1736644321794726", "1111111111111111"],
    });
    expect(fetchImpl.mock.calls[0][0]).toContain("page=rap");
  });

  test("treats a missing public configuration as inactive", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(200, { page: "home", pixelIds: [] }));
    await expect(fetchPublicPixelConfig("home", fetchImpl)).resolves.toEqual({
      page: "home",
      pixelIds: [],
    });
  });

  test("fails when the public API is unavailable", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(500, { error: "fail" }));
    await expect(fetchPublicPixelConfig("home", fetchImpl)).rejects.toThrow(/consultar/);
  });

  test("loads the admin configuration when authorized", async () => {
    const home = emptyPagesPixelForm().home;
    home[0] = { slot: 1, pixelId: "1736644321794726", active: true };
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(200, adminPagesBody({ home })));
    const result = await fetchAdminPixelConfig(fetchImpl);
    expect(result.unauthorized).toBe(false);
    expect(result.data.pages.home.slots[0].pixelId).toBe("1736644321794726");
  });

  test("blocks admin reads without permission", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(401, { error: "Não autenticado" }));
    await expect(fetchAdminPixelConfig(fetchImpl)).resolves.toEqual({
      unauthorized: true,
      data: null,
    });
  });

  test("saves admin page configurations", async () => {
    const form = emptyPagesPixelForm();
    form.home[0] = { slot: 1, pixelId: "1111111111111111", active: false };
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(200, adminPagesBody({ home: form.home })));
    const result = await saveAdminPixelPages(form, fetchImpl);
    expect(result.data.pages.home.slots[0].pixelId).toBe("1111111111111111");
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body).pages.home.slots[0]).toEqual({
      pixelId: "1111111111111111",
      active: false,
      slot: 1,
    });
  });

  test("rejects an invalid admin save", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(400, { error: "ID do Pixel inválido" }));
    await expect(saveAdminPixelPages(emptyPagesPixelForm(), fetchImpl)).rejects.toThrow("ID do Pixel inválido");
  });
});
