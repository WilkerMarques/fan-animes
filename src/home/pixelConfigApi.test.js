import {
  fetchAdminPixelConfig,
  fetchPublicPixelConfig,
  normalizePublicPixelConfig,
  saveAdminPixelConfig,
} from "./pixelConfigApi";

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

describe("pixelConfigApi", () => {
  test("normalizes a public config and ignores invalid IDs", () => {
    expect(normalizePublicPixelConfig({ pixelId: "1736644321794726", active: true })).toEqual({
      pixelId: "1736644321794726",
      active: true,
    });
    expect(normalizePublicPixelConfig({ pixelId: "<script>", active: true })).toEqual({
      pixelId: "",
      active: false,
    });
    expect(normalizePublicPixelConfig({})).toEqual({ pixelId: "", active: false });
  });

  test("reads the public configuration", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse(200, { pixelId: "1736644321794726", active: true })
    );
    await expect(fetchPublicPixelConfig(fetchImpl)).resolves.toEqual({
      pixelId: "1736644321794726",
      active: true,
    });
  });

  test("treats a missing public configuration as inactive", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(200, {}));
    await expect(fetchPublicPixelConfig(fetchImpl)).resolves.toEqual({
      pixelId: "",
      active: false,
    });
  });

  test("fails when the public API is unavailable", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(500, { error: "fail" }));
    await expect(fetchPublicPixelConfig(fetchImpl)).rejects.toThrow(/consultar/);
  });

  test("loads the admin configuration when authorized", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse(200, { pixelId: "1736644321794726", active: true, updatedAt: "2026-09-12T00:00:00-03:00", updatedBy: "admin" })
    );
    await expect(fetchAdminPixelConfig(fetchImpl)).resolves.toEqual({
      unauthorized: false,
      data: {
        pixelId: "1736644321794726",
        active: true,
        updatedAt: "2026-09-12T00:00:00-03:00",
        updatedBy: "admin",
      },
    });
  });

  test("blocks admin reads without permission", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(401, { error: "Não autenticado" }));
    await expect(fetchAdminPixelConfig(fetchImpl)).resolves.toEqual({
      unauthorized: true,
      data: null,
    });
  });

  test("saves an admin configuration", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse(200, { pixelId: "1111111111111111", active: false, updatedBy: "admin" })
    );
    const result = await saveAdminPixelConfig({ pixelId: "1111111111111111", active: false }, fetchImpl);
    expect(result.data.pixelId).toBe("1111111111111111");
    expect(result.data.active).toBe(false);
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({
      pixelId: "1111111111111111",
      active: false,
    });
  });

  test("rejects an invalid admin save", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(400, { error: "ID do Pixel inválido" }));
    await expect(saveAdminPixelConfig({ pixelId: "abc", active: true }, fetchImpl)).rejects.toThrow(
      "ID do Pixel inválido"
    );
  });
});
