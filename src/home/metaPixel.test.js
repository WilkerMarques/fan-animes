import { installMetaPixel, trackMetaClickButton, trackMetaPageView } from "./metaPixel";

describe("metaPixel", () => {
  beforeEach(() => {
    delete window.fbq;
    delete window._fbq;
    delete window.__fanAnimesMetaPixelId;
    delete window.__fanAnimesLastPageViewKey;
    document.querySelectorAll('script[src="https://connect.facebook.net/en_US/fbevents.js"]').forEach((node) => {
      node.remove();
    });
  });

  test("installs the pixel even when fbq already exists", () => {
    window.fbq = jest.fn();
    installMetaPixel("1736644321794726");
    expect(document.querySelector('script[src="https://connect.facebook.net/en_US/fbevents.js"]')).toBeTruthy();
    expect(window.fbq).toHaveBeenCalledWith("init", "1736644321794726");
  });

  test("disables automatic button tracking before init", () => {
    window.fbq = jest.fn();
    installMetaPixel("1736644321794726");
    expect(window.fbq.mock.calls[0]).toEqual(["set", "autoConfig", false, "1736644321794726"]);
    expect(window.fbq.mock.calls[1]).toEqual(["init", "1736644321794726"]);
  });

  test("tracks PageView without sending ClickButton", () => {
    window.fbq = jest.fn();
    installMetaPixel("1736644321794726");
    trackMetaPageView("home");
    expect(window.fbq).toHaveBeenCalledWith("track", "PageView");
    expect(window.fbq).not.toHaveBeenCalledWith("trackCustom", "ClickButton", expect.anything());
  });

  test("sends ClickButton only when asked", () => {
    window.fbq = jest.fn();
    installMetaPixel("1736644321794726");
    trackMetaClickButton("WhatsApp Comunidade", "whatsapp");
    expect(window.fbq).toHaveBeenCalledWith("trackCustom", "ClickButton", {
      content_name: "WhatsApp Comunidade",
      content_category: "whatsapp",
    });
  });

  test("tracks PageView after install only once per page", () => {
    window.fbq = jest.fn();
    installMetaPixel("1736644321794726");
    trackMetaPageView("home");
    trackMetaPageView("home");
    expect(window.fbq.mock.calls.filter((call) => call[0] === "track" && call[1] === "PageView")).toHaveLength(1);
    trackMetaPageView("sertanejo");
    expect(window.fbq.mock.calls.filter((call) => call[0] === "track" && call[1] === "PageView")).toHaveLength(2);
  });
});
