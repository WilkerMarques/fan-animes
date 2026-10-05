import { render, waitFor } from "@testing-library/react";
import { resolveEnabledPixelIds, usePixels } from "./usePixels";
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
    delete window.__fanAnimesMetaPixelIds;
    delete window.__fanAnimesLastPageViewKey;
    jest.spyOn(metaPixel, "installMetaPixels").mockImplementation((ids) => {
      window.__fanAnimesMetaPixelIds = new Set(ids);
      window.__fanAnimesMetaPixelId = ids[0];
      window.fbq = jest.fn();
    });
    jest.spyOn(metaPixel, "trackMetaPageView").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("does not enable pixels without configuration", () => {
    expect(resolveEnabledPixelIds({ pixelIds: [] })).toEqual([]);
    expect(resolveEnabledPixelIds({ pixelIds: ["1736644321794726"] })).toEqual(["1736644321794726"]);
  });

  test("keeps the site working when the API fails", async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error("network"));
    const { getByRole } = render(<Probe pageKey="home" fetchImpl={fetchImpl} />);
    await waitFor(() => expect(getByRole("button")).toHaveTextContent("off"));
    expect(metaPixel.installMetaPixels).not.toHaveBeenCalled();
  });

  test("initializes active pixels for the page and keeps ClickButton available", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ page: "rap", pixelIds: ["1736644321794726", "1111111111111111"] }),
    });
    const { getByRole } = render(<Probe pageKey="rap" fetchImpl={fetchImpl} />);

    await waitFor(() => expect(metaPixel.installMetaPixels).toHaveBeenCalledTimes(1));
    expect(metaPixel.installMetaPixels).toHaveBeenCalledWith(["1736644321794726", "1111111111111111"]);
    expect(metaPixel.trackMetaPageView).toHaveBeenCalledWith("rap");
    expect(fetchImpl.mock.calls[0][0]).toContain("page=rap");

    getByRole("button").click();
    expect(window.fbq).toHaveBeenCalledWith("trackCustom", "ClickButton", {
      content_name: "Spotify",
      content_category: "spotify",
    });
  });

  test("refetches when the landing page changes", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ page: "home", pixelIds: ["1736644321794726"] }),
    });

    const { rerender } = render(<Probe pageKey="home" fetchImpl={fetchImpl} />);
    await waitFor(() => expect(metaPixel.installMetaPixels).toHaveBeenCalled());

    fetchImpl.mockResolvedValue({
      ok: true,
      json: async () => ({ page: "rock", pixelIds: ["2222222222222222"] }),
    });
    rerender(<Probe pageKey="rock" fetchImpl={fetchImpl} />);
    await waitFor(() =>
      expect(metaPixel.installMetaPixels).toHaveBeenCalledWith(["2222222222222222"])
    );
  });
});
