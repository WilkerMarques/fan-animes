import { useEffect, useMemo, useState } from "react";
import { installMetaPixels, trackMetaClickButton, trackMetaPageView } from "./metaPixel";
import { fetchPublicPixelConfig } from "./pixelConfigApi";
import { normalizePixelPageKey } from "./landingPages";

export function resolveEnabledPixelIds(config) {
  if (!config || !Array.isArray(config.pixelIds)) {
    return [];
  }
  return config.pixelIds.filter((id) => typeof id === "string" && id.trim() !== "");
}

export function usePixels({ pageKey, fetchImpl } = {}) {
  const normalizedPageKey = normalizePixelPageKey(pageKey);
  const [config, setConfig] = useState({ page: normalizedPageKey, pixelIds: [] });

  useEffect(() => {
    let cancelled = false;

    fetchPublicPixelConfig(normalizedPageKey, fetchImpl)
      .then((next) => {
        if (!cancelled) setConfig(next);
      })
      .catch(() => {
        if (!cancelled) setConfig({ page: normalizedPageKey, pixelIds: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [fetchImpl, normalizedPageKey]);

  const metaPixelIds = useMemo(() => resolveEnabledPixelIds(config), [config]);
  const metaPixelIdsKey = metaPixelIds.join(",");
  const metaPixelActive = metaPixelIds.length > 0;

  useEffect(() => {
    if (!metaPixelActive) return;

    installMetaPixels(metaPixelIds);
    trackMetaPageView(normalizedPageKey);
  }, [metaPixelIds, metaPixelIdsKey, metaPixelActive, normalizedPageKey]);

  useEffect(() => {
    if (!metaPixelActive) return;

    function onPageShow(event) {
      if (!event.persisted) return;
      installMetaPixels(metaPixelIds);
      trackMetaPageView(normalizedPageKey);
    }

    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [metaPixelIds, metaPixelIdsKey, metaPixelActive, normalizedPageKey]);

  const fireClickButton = (label, platform) => {
    if (!metaPixelActive) {
      return;
    }
    trackMetaClickButton(label, platform);
  };

  return {
    fireClickButton,
    pixelId: metaPixelIds[0] || "",
    pixelIds: metaPixelIds,
    pixelActive: metaPixelActive,
  };
}
