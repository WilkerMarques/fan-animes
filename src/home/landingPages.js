export const PIXEL_SLOTS_PER_PAGE = 5;

export const PIXEL_PROVIDERS = [
  { key: "meta", label: "Meta (Facebook)" },
  { key: "openai", label: "ChatGPT / OpenAI" },
];

export const PIXEL_PROVIDER_KEYS = PIXEL_PROVIDERS.map((provider) => provider.key);

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

export function normalizePixelProvider(value) {
  const key = String(value ?? "").trim().toLowerCase();
  if (PIXEL_PROVIDER_KEYS.includes(key)) {
    return key;
  }
  return "meta";
}

export function emptyPixelSlots() {
  return Array.from({ length: PIXEL_SLOTS_PER_PAGE }, (_, index) => ({
    slot: index + 1,
    pixelId: "",
    active: false,
  }));
}

export function emptyPageProvidersForm() {
  return Object.fromEntries(PIXEL_PROVIDER_KEYS.map((provider) => [provider, emptyPixelSlots()]));
}

export function emptyPagesPixelForm() {
  return Object.fromEntries(
    PIXEL_LANDING_PAGE_KEYS.map((pageKey) => [pageKey, emptyPageProvidersForm()])
  );
}
