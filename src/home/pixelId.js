export function normalizeMetaPixelId(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

export function isValidMetaPixelId(value) {
  const id = normalizeMetaPixelId(value);
  if (!id) {
    return false;
  }
  if (/[<>]|script|fbq|function|javascript:/i.test(id)) {
    return false;
  }
  return /^\d{10,20}$/.test(id);
}

export function canSavePixelConfig({ pixelId, active }) {
  const id = normalizeMetaPixelId(pixelId);
  if (active) {
    return isValidMetaPixelId(id);
  }
  return id === "" || isValidMetaPixelId(id);
}
