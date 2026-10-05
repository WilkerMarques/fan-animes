export const PIXEL_SLOTS_PER_PAGE = 5;

export const PIXEL_LANDING_PAGES = [
  { key: "home", path: "/", label: "Home" },
  { key: "rap", path: "/rap", label: "Rap" },
  { key: "rock", path: "/rock", label: "Rock" },
  { key: "sad", path: "/sad", label: "Sad" },
  { key: "sertanejo", path: "/sertanejo", label: "Sertanejo" },
  { key: "fananimes", path: "/fananimes", label: "Fan Animes" },
];

export const PIXEL_LANDING_PAGE_KEYS = PIXEL_LANDING_PAGES.map((page) => page.key);

export function normalizePixelPageKey(value) {
  const key = String(value ?? "").trim().toLowerCase();
  if (PIXEL_LANDING_PAGE_KEYS.includes(key)) {
    return key;
  }
  return "home";
}

export function emptyPixelSlots() {
  return Array.from({ length: PIXEL_SLOTS_PER_PAGE }, () => ({ pixelId: "", active: false }));
}

export function emptyPagesPixelForm() {
  return Object.fromEntries(PIXEL_LANDING_PAGE_KEYS.map((key) => [key, emptyPixelSlots()]));
}
