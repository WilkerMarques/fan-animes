import { getYoutubeChannel, openExternalUrl, resolveHomeLinkAction, YOUTUBE_CHANNELS } from "./youtubeChannels";

describe("youtubeChannels", () => {
  test("exposes a complete channel for each genre", () => {
    Object.values(YOUTUBE_CHANNELS).forEach((channel) => {
      expect(channel.name).toBeTruthy();
      expect(channel.channelUrl).toMatch(/^https:\/\/www\.youtube\.com\/@/);
      expect(channel.subscribeUrl).toBe(`${channel.channelUrl}?sub_confirmation=1`);
    });
  });

  test("reads channel data from a YouTube link", () => {
    const link = {
      id: 7,
      icon: "youtube",
      label: "🎸 Fan Animes Rock",
      url: "https://www.youtube.com/watch?v=VSb1XQed2Eg&list=PLvnhNp1htaiGxEch5KlLCsgBoMtIktq2p",
      ...YOUTUBE_CHANNELS.rock,
    };

    expect(getYoutubeChannel(link)).toEqual({
      name: YOUTUBE_CHANNELS.rock.name,
      label: link.label,
      playlistUrl: link.url,
      subscribeUrl: YOUTUBE_CHANNELS.rock.subscribeUrl,
    });
  });

  test("throws when a YouTube link is missing channel data", () => {
    expect(() => getYoutubeChannel({ id: 5, icon: "youtube", url: "https://youtube.com" })).toThrow(
      /missing name, label, playlist url or subscribeUrl/
    );
  });

  test("opens the YouTube choice instead of the playlist URL", () => {
    const link = {
      id: 8,
      icon: "youtube",
      label: "🎤 Fan Animes Rap",
      url: "https://www.youtube.com/watch?v=mzRLZHzeQUs&list=PLimPNI2iN0Jf4ZazKK6sq9s0htEwGcQvy",
      ...YOUTUBE_CHANNELS.rap,
    };

    expect(resolveHomeLinkAction(link)).toEqual({
      type: "youtube-choice",
      channel: {
        name: YOUTUBE_CHANNELS.rap.name,
        label: link.label,
        playlistUrl: link.url,
        subscribeUrl: YOUTUBE_CHANNELS.rap.subscribeUrl,
      },
    });
  });

  test("keeps Spotify and other networks as direct URL opens", () => {
    const spotify = {
      id: 1,
      icon: "spotify",
      url: "https://open.spotify.com/playlist/2jE5C8SoYWX1SB0C0IoLBB",
    };
    const tiktok = {
      id: 10,
      icon: "tiktok",
      url: "https://www.tiktok.com/@fananimesoficial",
    };

    expect(resolveHomeLinkAction(spotify)).toEqual({ type: "open-url", url: spotify.url });
    expect(resolveHomeLinkAction(tiktok)).toEqual({ type: "open-url", url: tiktok.url });
  });

  test("opens external URLs with noopener and noreferrer", () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
    openExternalUrl("https://www.youtube.com/@FanAnimesRock");
    expect(openSpy).toHaveBeenCalledWith(
      "https://www.youtube.com/@FanAnimesRock",
      "_blank",
      "noopener,noreferrer"
    );
    openSpy.mockRestore();
  });
});
