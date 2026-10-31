import {
  canSavePixelConfig,
  canSavePixelSlots,
  isValidMetaPixelId,
  normalizeMetaPixelId,
  PIXEL_ID_MAX_LENGTH,
} from "./pixelId";

describe("pixelId", () => {
  test("accepts common pixel ID formats", () => {
    expect(isValidMetaPixelId("1736644321794726")).toBe(true);
    expect(isValidMetaPixelId("C1234567890ABCDEF")).toBe(true);
    expect(isValidMetaPixelId("tiktok-pixel_01.test")).toBe(true);
    expect(isValidMetaPixelId("abc123")).toBe(true);
  });

  test("rejects empty, oversized, and unsafe values", () => {
    expect(isValidMetaPixelId("")).toBe(false);
    expect(isValidMetaPixelId("a".repeat(PIXEL_ID_MAX_LENGTH + 1))).toBe(false);
    expect(isValidMetaPixelId("<script>alert(1)</script>")).toBe(false);
    expect(isValidMetaPixelId("javascript:alert(1)")).toBe(false);
  });

  test("normalizes whitespace", () => {
    expect(normalizeMetaPixelId("  1736644321794726  ")).toBe("1736644321794726");
  });

  test("canSavePixelConfig rules", () => {
    expect(canSavePixelConfig({ pixelId: "", active: false })).toBe(true);
    expect(canSavePixelConfig({ pixelId: "", active: true })).toBe(false);
    expect(canSavePixelConfig({ pixelId: "1736644321794726", active: true })).toBe(true);
    expect(canSavePixelSlots([{ pixelId: "", active: false }, { pixelId: "C0FFEE", active: true }])).toBe(
      true
    );
    expect(canSavePixelSlots([{ pixelId: "<img>", active: true }])).toBe(false);
  });
});
