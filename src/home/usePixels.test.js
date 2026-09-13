import { render, waitFor } from "@testing-library/react";
import { resolveEnabledPixel, usePixels } from "./usePixels";
import * as metaPixel from "./metaPixel";

function Probe({ pageKey, fetchImpl }) {
  const { fireClickButton, pixelId } = usePixels({ pageKey, fetchImpl });
  return (
    <button type="button" onClick={() => fireClickButton("Spotify", "spotify")}>
      {pixelId || "off"}
    </button>
  );
}

describe("usePixels", () => {
  beforeEach(() => {
    delete window.fbq;
    delete window.__fanAnimesMetaPixelId;
    delete window.__fanAnimesLastPageViewKey;
    jest.spyOn(metaPixel, "installMetaPixel").mockImplementation((id) => {
      window.__fanAnimesMetaPixelId = id;
      window.fbq = jest.fn();
    });
    jest.spyOn(metaPixel, "trackMetaPageView").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("does not enable a pixel without configuration", () => {
    expect(resolveEnabledPixel({ pixelId: "", active: false })).toBe("");
    expect(resolveEnabledPixel({ pixelId: "1736644321794726", active: false })).toBe("");
  });

  test("keeps the site working when the API fails", async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error("network"));
    const { getByRole } = render(<Probe pageKey="home" fetchImpl={fetchImpl} />);
    await waitFor(() => expect(getByRole("button")).toHaveTextContent("off"));
    expect(metaPixel.installMetaPixel).not.toHaveBeenCalled();
  });

  test("initializes the pixel once and keeps ClickButton available", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ pixelId: "1736644321794726", active: true }),
    });
    const { getByRole } = render(<Probe pageKey="home" fetchImpl={fetchImpl} />);

    await waitFor(() => expect(metaPixel.installMetaPixel).toHaveBeenCalledTimes(1));
    expect(metaPixel.installMetaPixel).toHaveBeenCalledWith("1736644321794726");
    expect(metaPixel.trackMetaPageView).toHaveBeenCalledWith("home");

    getByRole("button").click();
    expect(window.fbq).toHaveBeenCalledWith("trackCustom", "ClickButton", {
      content_name: "Spotify",
      content_category: "spotify",
    });
  });

  test("uses the new ID after the public configuration changes", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pixelId: "1736644321794726", active: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pixelId: "1111111111111111", active: true }),
      });

    const first = render(<Probe pageKey="home" fetchImpl={fetchImpl} />);
    await waitFor(() => expect(metaPixel.installMetaPixel).toHaveBeenCalledWith("1736644321794726"));
    first.unmount();

    render(<Probe pageKey="home" fetchImpl={fetchImpl} />);
    await waitFor(() => expect(metaPixel.installMetaPixel).toHaveBeenCalledWith("1111111111111111"));
  });
});
