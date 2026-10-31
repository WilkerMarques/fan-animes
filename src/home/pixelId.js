export const PIXEL_ID_MAX_LENGTH = 128;

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
  if (id.length > PIXEL_ID_MAX_LENGTH) {
    return false;
  }
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(id)) {
    return false;
  }
  if (/[<>]|script|javascript:|vbscript:|data:|onerror=/i.test(id)) {
    return false;
  }
  return true;
}

export function canSavePixelConfig({ pixelId, active }) {
  const id = normalizeMetaPixelId(pixelId);
  if (active) {
    return isValidMetaPixelId(id);
  }
  return id === "" || isValidMetaPixelId(id);
}

export function canSavePixelSlots(slots) {
  if (!Array.isArray(slots)) {
    return false;
  }
  return slots.every((slot) => canSavePixelConfig(slot));
}
