const OPENAI_PIXEL_SCRIPT = "https://bzrcdn.openai.com/sdk/oaiq.min.js";

function ensureOaiqStub() {
  if (typeof window.oaiq === "function") {
    return;
  }
  const queue = function oaiq() {
    oaiq.q.push(arguments);
  };
  queue.q = [];
  window.oaiq = queue;
}

function ensureOpenAiPixelScript() {
  if (document.querySelector(`script[src="${OPENAI_PIXEL_SCRIPT}"]`)) {
    return;
  }
  const script = document.createElement("script");
  script.async = true;
  script.src = OPENAI_PIXEL_SCRIPT;
  const firstScript = document.getElementsByTagName("script")[0];
  if (firstScript && firstScript.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
    return;
  }
  document.head.appendChild(script);
}

function ensureInstalledOpenAiPixelSet() {
  if (!(window.__fanAnimesOpenAiPixelIds instanceof Set)) {
    window.__fanAnimesOpenAiPixelIds = new Set();
  }
  return window.__fanAnimesOpenAiPixelIds;
}

export function installOpenAiPixels(pixelIds) {
  const ids = [
    ...new Set(
      (Array.isArray(pixelIds) ? pixelIds : [])
        .map((id) => (typeof id === "string" ? id.trim() : ""))
        .filter(Boolean)
    ),
  ];
  if (ids.length === 0) {
    return;
  }

  ensureOaiqStub();
  ensureOpenAiPixelScript();
  const installed = ensureInstalledOpenAiPixelSet();
  for (const pixelId of ids) {
    if (installed.has(pixelId)) {
      continue;
    }
    window.oaiq("init", { pixelId });
    installed.add(pixelId);
  }
}

function pageViewDedupeKey(pageKey) {
  const installed = ensureInstalledOpenAiPixelSet();
  const ids = [...installed].sort().join(",");
  return `${ids}:${pageKey}`;
}

export function trackOpenAiPageView(pageKey = "") {
  if (typeof window.oaiq !== "function") {
    throw new Error("OpenAI Pixel is not installed");
  }
  const key = pageViewDedupeKey(pageKey);
  if (window.__fanAnimesLastOpenAiPageViewKey === key) {
    return;
  }
  window.__fanAnimesLastOpenAiPageViewKey = key;
  const pageId = String(pageKey || "home");
  window.oaiq("measure", "page_viewed", {
    type: "contents",
    contents: [{ id: pageId, name: pageId, content_type: "page" }],
  });
}

export function trackOpenAiClickButton(label, platform) {
  if (typeof window.oaiq !== "function") {
    throw new Error("OpenAI Pixel is not installed");
  }
  const contentName = String(label ?? "").trim();
  const contentCategory = String(platform ?? "").trim();
  if (!contentName || !contentCategory) {
    throw new Error("ClickButton requires label and platform.");
  }
  window.oaiq("measure", "contents_viewed", {
    type: "contents",
    contents: [{ id: contentCategory, name: contentName, content_type: "link" }],
  });
}
