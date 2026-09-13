import { isValidMetaPixelId, normalizeMetaPixelId } from "./pixelId";

const API_BASE = (process.env.REACT_APP_API_URL || "").trim();

export function publicPixelConfigUrl() {
  return `${API_BASE}/api/pixel-config`;
}

export function adminPixelConfigUrl() {
  return `${API_BASE}/api/dashboard-pixel-config`;
}

export function normalizePublicPixelConfig(data) {
  const pixelId = isValidMetaPixelId(data?.pixelId) ? normalizeMetaPixelId(data.pixelId) : "";
  return {
    pixelId,
    active: data?.active === true && Boolean(pixelId),
  };
}

export function normalizeAdminPixelConfig(data) {
  const pixelId = typeof data?.pixelId === "string" ? normalizeMetaPixelId(data.pixelId) : "";
  return {
    pixelId: pixelId && isValidMetaPixelId(pixelId) ? pixelId : "",
    active: data?.active === true,
    updatedAt: typeof data?.updatedAt === "string" ? data.updatedAt : null,
    updatedBy: typeof data?.updatedBy === "string" ? data.updatedBy : null,
  };
}

export async function fetchPublicPixelConfig(fetchImpl = fetch) {
  const res = await fetchImpl(publicPixelConfigUrl(), {
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
  return { unauthorized: false, data: normalizeAdminPixelConfig(await res.json()) };
}

export async function saveAdminPixelConfig({ pixelId, active }, fetchImpl = fetch) {
  const res = await fetchImpl(adminPixelConfigUrl(), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ pixelId: normalizeMetaPixelId(pixelId), active: Boolean(active) }),
  });
  if (res.status === 401) {
    return { unauthorized: true, data: null };
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Erro ao salvar configuração do Pixel");
  }
  return { unauthorized: false, data: normalizeAdminPixelConfig(body) };
}
