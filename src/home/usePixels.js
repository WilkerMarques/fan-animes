import { useEffect, useMemo, useState } from "react";
import { installMetaPixels, trackMetaClickButton, trackMetaPageView } from "./metaPixel";
import { installOpenAiPixels, trackOpenAiClickButton, trackOpenAiPageView } from "./openAiPixel";
import { fetchPublicPixelConfig } from "./pixelConfigApi";
import { normalizePixelPageKey } from "./landingPages";

export function resolveProviderPixelIds(config, provider) {
  if (!config) {
    return [];
  }
  const bucket = config[provider]?.pixelIds;
  if (Array.isArray(bucket)) {
    return bucket.filter((id) => typeof id === "string" && id.trim() !== "");
  }
  if (provider === "meta" && Array.isArray(config.pixelIds)) {
    return config.pixelIds.filter((id) => typeof id === "string" && id.trim() !== "");
  }
  return [];
}

export function usePixels({ pageKey, fetchImpl } = {}) {
  const normalizedPageKey = normalizePixelPageKey(pageKey);
  const [config, setConfig] = useState({
    page: normalizedPageKey,
    meta: { pixelIds: [] },
    openai: { pixelIds: [] },
  });

  useEffect(() => {
    let cancelled = false;

    fetchPublicPixelConfig(normalizedPageKey, fetchImpl)
      .then((next) => {
        if (!cancelled) setConfig(next);
      })
      .catch(() => {
        if (!cancelled) {
          setConfig({
            page: normalizedPageKey,
            meta: { pixelIds: [] },
            openai: { pixelIds: [] },
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchImpl, normalizedPageKey]);

  const metaPixelIds = useMemo(() => resolveProviderPixelIds(config, "meta"), [config]);
  const openAiPixelIds = useMemo(() => resolveProviderPixelIds(config, "openai"), [config]);
  const metaPixelIdsKey = metaPixelIds.join(",");
  const openAiPixelIdsKey = openAiPixelIds.join(",");
  const metaPixelActive = metaPixelIds.length > 0;
  const openAiPixelActive = openAiPixelIds.length > 0;
  const pixelActive = metaPixelActive || openAiPixelActive;

  useEffect(() => {
    if (metaPixelActive) {
      installMetaPixels(metaPixelIds);
      trackMetaPageView(normalizedPageKey);
    }
    if (openAiPixelActive) {
      installOpenAiPixels(openAiPixelIds);
      trackOpenAiPageView(normalizedPageKey);
    }
  }, [
    metaPixelIds,
    metaPixelIdsKey,
    metaPixelActive,
    openAiPixelIds,
    openAiPixelIdsKey,
    openAiPixelActive,
    normalizedPageKey,
  ]);

  useEffect(() => {
    if (!pixelActive) return;

    function onPageShow(event) {
      if (!event.persisted) return;
      if (metaPixelActive) {
        installMetaPixels(metaPixelIds);
        trackMetaPageView(normalizedPageKey);
      }
      if (openAiPixelActive) {
        installOpenAiPixels(openAiPixelIds);
        trackOpenAiPageView(normalizedPageKey);
      }
    }

    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [
    metaPixelIds,
    metaPixelIdsKey,
    metaPixelActive,
    openAiPixelIds,
    openAiPixelIdsKey,
    openAiPixelActive,
    normalizedPageKey,
    pixelActive,
  ]);

  const fireClickButton = (label, platform) => {
    if (metaPixelActive) {
      trackMetaClickButton(label, platform);
    }
    if (openAiPixelActive) {
      trackOpenAiClickButton(label, platform);
    }
  };

  return {
    fireClickButton,
    pixelId: metaPixelIds[0] || openAiPixelIds[0] || "",
    pixelIds: metaPixelIds,
    openAiPixelIds,
    pixelActive,
  };
}
