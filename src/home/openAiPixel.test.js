import { installOpenAiPixels, trackOpenAiClickButton, trackOpenAiPageView } from "./openAiPixel";

describe("openAiPixel", () => {
  beforeEach(() => {
    delete window.oaiq;
    delete window.__fanAnimesOpenAiPixelIds;
    delete window.__fanAnimesLastOpenAiPageViewKey;
    document.querySelectorAll('script[src="https://bzrcdn.openai.com/sdk/oaiq.min.js"]').forEach((node) => {
      node.remove();
    });
  });

  test("installs the OpenAI pixel and loads the SDK", () => {
    window.oaiq = jest.fn();
    installOpenAiPixels(["MCJXHhHwXwLQLYxMWbCEAs"]);
    expect(document.querySelector('script[src="https://bzrcdn.openai.com/sdk/oaiq.min.js"]')).toBeTruthy();
    expect(window.oaiq).toHaveBeenCalledWith("init", { pixelId: "MCJXHhHwXwLQLYxMWbCEAs" });
  });

  test("tracks page_viewed once per page", () => {
    window.oaiq = jest.fn();
    installOpenAiPixels(["MCJXHhHwXwLQLYxMWbCEAs"]);
    trackOpenAiPageView("rap");
    trackOpenAiPageView("rap");
    expect(window.oaiq.mock.calls.filter((call) => call[1] === "page_viewed")).toHaveLength(1);
  });

  test("tracks contents_viewed on link clicks", () => {
    window.oaiq = jest.fn();
    installOpenAiPixels(["MCJXHhHwXwLQLYxMWbCEAs"]);
    trackOpenAiClickButton("WhatsApp Comunidade", "whatsapp");
    expect(window.oaiq).toHaveBeenCalledWith("measure", "contents_viewed", {
      type: "contents",
      contents: [{ id: "whatsapp", name: "WhatsApp Comunidade", content_type: "link" }],
    });
  });
});
