import { render, waitFor } from "@testing-library/react";
import { resolveProviderPixelIds, usePixels } from "./usePixels";
import * as metaPixel from "./metaPixel";
import * as openAiPixel from "./openAiPixel";

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
    delete window.oaiq;
    jest.spyOn(metaPixel, "installMetaPixels").mockImplementation(() => {
      window.fbq = jest.fn();
    });
    jest.spyOn(metaPixel, "trackMetaPageView").mockImplementation(() => {});
    jest.spyOn(openAiPixel, "installOpenAiPixels").mockImplementation(() => {
      window.oaiq = jest.fn();
    });
    jest.spyOn(openAiPixel, "trackOpenAiPageView").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("resolves provider pixel ids", () => {
    expect(resolveProviderPixelIds({ meta: { pixelIds: ["111"] }, openai: { pixelIds: ["ABC"] } }, "meta")).toEqual([
      "111",
    ]);
    expect(resolveProviderPixelIds({ meta: { pixelIds: ["111"] }, openai: { pixelIds: ["ABC"] } }, "openai")).toEqual([
      "ABC",
    ]);
  });

  test("keeps the site working when the API fails", async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error("network"));
    const { getByRole } = render(<Probe pageKey="home" fetchImpl={fetchImpl} />);
    await waitFor(() => expect(getByRole("button")).toHaveTextContent("off"));
    expect(metaPixel.installMetaPixels).not.toHaveBeenCalled();
    expect(openAiPixel.installOpenAiPixels).not.toHaveBeenCalled();
  });

  test("initializes Meta and OpenAI pixels for the page", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        page: "rap",
        meta: { pixelIds: ["1736644321794726"] },
        openai: { pixelIds: ["MCJXHhHwXwLQLYxMWbCEAs"] },
      }),
    });
    render(<Probe pageKey="rap" fetchImpl={fetchImpl} />);

    await waitFor(() => expect(metaPixel.installMetaPixels).toHaveBeenCalledWith(["1736644321794726"]));
    expect(openAiPixel.installOpenAiPixels).toHaveBeenCalledWith(["MCJXHhHwXwLQLYxMWbCEAs"]);
    expect(metaPixel.trackMetaPageView).toHaveBeenCalledWith("rap");
    expect(openAiPixel.trackOpenAiPageView).toHaveBeenCalledWith("rap");
  });
});
