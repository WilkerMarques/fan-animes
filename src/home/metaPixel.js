const META_PIXEL_SCRIPT = "https://connect.facebook.net/en_US/fbevents.js";

function ensureFbqStub() {
  if (typeof window.fbq === "function") {
    return;
  }

  const fbq = function fbq() {
    if (fbq.callMethod) {
      fbq.callMethod.apply(fbq, arguments);
      return;
    }
    fbq.queue.push(arguments);
  };
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;
  if (!window._fbq) {
    window._fbq = fbq;
  }
}

function ensureFbeventsScript() {
  if (document.querySelector(`script[src="${META_PIXEL_SCRIPT}"]`)) {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = META_PIXEL_SCRIPT;
  const firstScript = document.getElementsByTagName("script")[0];
  if (firstScript && firstScript.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
    return;
  }
  document.head.appendChild(script);
}

export function installMetaPixel(pixelId) {
  const id = typeof pixelId === "string" ? pixelId.trim() : "";
  if (!id) {
    throw new Error("Missing Meta Pixel ID");
  }

  ensureFbqStub();
  ensureFbeventsScript();

  if (window.__fanAnimesMetaPixelId !== id) {
    window.fbq("set", "autoConfig", false, id);
    window.fbq("init", id);
    window.__fanAnimesMetaPixelId = id;
  }
}

export function trackMetaPageView(pageKey = "") {
  if (typeof window.fbq !== "function") {
    throw new Error("Meta Pixel is not installed");
  }
  const key = `${window.__fanAnimesMetaPixelId || ""}:${pageKey}`;
  if (window.__fanAnimesLastPageViewKey === key) {
    return;
  }
  window.__fanAnimesLastPageViewKey = key;
  window.fbq("track", "PageView");
}
