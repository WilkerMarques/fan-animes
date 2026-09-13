import { useEffect, useState } from "react";
import { installMetaPixel, trackMetaPageView } from "./metaPixel";
import { fetchPublicPixelConfig } from "./pixelConfigApi";

export function resolveEnabledPixel(config) {
  if (!config || !config.active || !config.pixelId) {
    return "";
  }
  return config.pixelId;
}

export function usePixels({ pageKey, fetchImpl } = {}) {
  const [config, setConfig] = useState({ pixelId: "", active: false });

  useEffect(() => {
    let cancelled = false;

    fetchPublicPixelConfig(fetchImpl)
      .then((next) => {
        if (!cancelled) setConfig(next);
      })
      .catch(() => {
        if (!cancelled) setConfig({ pixelId: "", active: false });
      });

    return () => {
      cancelled = true;
    };
  }, [fetchImpl]);

  const metaPixelId = resolveEnabledPixel(config);

  useEffect(() => {
    if (!metaPixelId) return;

    installMetaPixel(metaPixelId);
    trackMetaPageView(pageKey);
  }, [metaPixelId, pageKey]);

  useEffect(() => {
    if (!metaPixelId) return;

    function onPageShow(event) {
      if (!event.persisted) return;
      installMetaPixel(metaPixelId);
      trackMetaPageView(pageKey);
    }

    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [metaPixelId, pageKey]);

  const fireClickButton = (label, platform) => {
    if (metaPixelId && window.fbq) {
      window.fbq("trackCustom", "ClickButton", {
        content_name: label,
        content_category: platform,
      });
    }
  };

  return { fireClickButton, pixelId: metaPixelId, pixelActive: Boolean(metaPixelId) };
}
