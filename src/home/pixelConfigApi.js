import {
  emptyPagesPixelForm,
  normalizePixelPageKey,
  PIXEL_SLOTS_PER_PAGE,
} from "./landingPages";
import { isValidMetaPixelId, normalizeMetaPixelId } from "./pixelId";

const API_BASE = (process.env.REACT_APP_API_URL || "").trim();

export function publicPixelConfigUrl(pageKey = "home") {
  const page = normalizePixelPageKey(pageKey);
  return `${API_BASE}/api/pixel-config?page=${encodeURIComponent(page)}`;
}

export function adminPixelConfigUrl() {
  return `${API_BASE}/api/dashboard-pixel-config`;
}

export function normalizePixelSlot(data, slotNumber) {
  const pixelId = typeof data?.pixelId === "string" ? normalizeMetaPixelId(data.pixelId) : "";
  const validId = pixelId && isValidMetaPixelId(pixelId) ? pixelId : "";
  return {
    slot: slotNumber,
    pixelId: validId,
    active: data?.active === true && Boolean(validId),
  };
}

export function normalizePagePixelSlots(slots) {
  if (!Array.isArray(slots)) {
    return Array.from({ length: PIXEL_SLOTS_PER_PAGE }, (_, index) =>
      normalizePixelSlot({}, index + 1)
    );
  }
  return Array.from({ length: PIXEL_SLOTS_PER_PAGE }, (_, index) =>
    normalizePixelSlot(slots[index] ?? {}, index + 1)
  );
}

export function normalizePublicPixelConfig(data) {
  const page = normalizePixelPageKey(data?.page);
  const rawIds = Array.isArray(data?.pixelIds) ? data.pixelIds : [];
  const pixelIds = [...new Set(rawIds.map((id) => normalizeMetaPixelId(id)).filter(isValidMetaPixelId))];
  if (pixelIds.length > 0) {
    return { page, pixelIds };
  }
  const legacyId = isValidMetaPixelId(data?.pixelId) ? normalizeMetaPixelId(data.pixelId) : "";
  if (legacyId && data?.active === true) {
    return { page, pixelIds: [legacyId] };
  }
  return { page, pixelIds: [] };
}

export function normalizeAdminPagesPixelConfig(data) {
  const pagesInput = data?.pages;
  if (!pagesInput || typeof pagesInput !== "object") {
    if (typeof data?.pixelId === "string") {
      const pages = emptyPagesPixelForm();
      pages.home[0] = normalizePixelSlot(
        { pixelId: data.pixelId, active: data.active },
        1
      );
      return {
        pages: Object.fromEntries(
          Object.keys(pages).map((key) => [
            key,
            {
              slots: pages[key],
              updatedAt: key === "home" && typeof data.updatedAt === "string" ? data.updatedAt : null,
              updatedBy: key === "home" && typeof data.updatedBy === "string" ? data.updatedBy : null,
            },
          ])
        ),
      };
    }
    return { pages: Object.fromEntries(
      Object.keys(emptyPagesPixelForm()).map((key) => [
        key,
        { slots: normalizePagePixelSlots([]), updatedAt: null, updatedBy: null },
      ])
    ) };
  }

  const pages = {};
  for (const [pageKey, pageData] of Object.entries(pagesInput)) {
    pages[pageKey] = {
      slots: normalizePagePixelSlots(pageData?.slots),
      updatedAt: typeof pageData?.updatedAt === "string" ? pageData.updatedAt : null,
      updatedBy: typeof pageData?.updatedBy === "string" ? pageData.updatedBy : null,
    };
  }
  return { pages };
}

export async function fetchPublicPixelConfig(pageKey = "home", fetchImpl = fetch) {
  const res = await fetchImpl(publicPixelConfigUrl(pageKey), {
    method: "GET",
    cache: "no-store",
    headers: { "Cache-Control": "no-store" },
  });
  if (!res.ok) {
    throw new Error("Falha ao consultar configuração do Pixel");
  }
  return normalizePublicPixelConfig(await res.json());
}

export async function fetchAdminPixelConfig(fetchImpl = fetch) {
  const res = await fetchImpl(adminPixelConfigUrl(), {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  if (res.status === 401) {
    return { unauthorized: true, data: null };
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao buscar configuração do Pixel");
  }
  return { unauthorized: false, data: normalizeAdminPagesPixelConfig(await res.json()) };
}

export function buildAdminPagesPayload(pagesForm) {
  return {
    pages: Object.fromEntries(
      Object.entries(pagesForm).map(([pageKey, slots]) => [
        pageKey,
        {
          slots: slots.map((slot, index) => ({
            pixelId: normalizeMetaPixelId(slot.pixelId),
            active: Boolean(slot.active),
            slot: index + 1,
          })),
        },
      ])
    ),
  };
}

export async function saveAdminPixelPages(pagesForm, fetchImpl = fetch) {
  const res = await fetchImpl(adminPixelConfigUrl(), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(buildAdminPagesPayload(pagesForm)),
  });
  if (res.status === 401) {
    return { unauthorized: true, data: null };
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Erro ao salvar configuração do Pixel");
  }
  return { unauthorized: false, data: normalizeAdminPagesPixelConfig(body) };
}
