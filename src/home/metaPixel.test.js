import { installMetaPixel, trackMetaPageView } from "./metaPixel";

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
