import { canSavePixelConfig, isValidMetaPixelId, normalizeMetaPixelId } from "./pixelId";

describe("pixelId", () => {
  test("accepts a numeric Meta Pixel ID", () => {
    expect(isValidMetaPixelId("1736644321794726")).toBe(true);
    expect(normalizeMetaPixelId(" 1736644321794726 ")).toBe("1736644321794726");
  });

  test("rejects scripts and invalid IDs", () => {
    expect(isValidMetaPixelId("")).toBe(false);
    expect(isValidMetaPixelId("fbq('init','123')")).toBe(false);
    expect(isValidMetaPixelId("<script>alert(1)</script>")).toBe(false);
    expect(isValidMetaPixelId("javascript:alert(1)")).toBe(false);
    expect(isValidMetaPixelId("abc123")).toBe(false);
    expect(isValidMetaPixelId("123")).toBe(false);
  });

  test("allows an empty ID only when the pixel is inactive", () => {
    expect(canSavePixelConfig({ pixelId: "", active: false })).toBe(true);
    expect(canSavePixelConfig({ pixelId: "", active: true })).toBe(false);
    expect(canSavePixelConfig({ pixelId: "1736644321794726", active: true })).toBe(true);
  });
});
