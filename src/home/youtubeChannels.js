export const YOUTUBE_CHANNELS = {
  main: {
    name: "Fan Animes",
    channelUrl: "https://www.youtube.com/@faananimes",
    subscribeUrl: "https://www.youtube.com/@faananimes?sub_confirmation=1",
  },
  rap: {
    name: "Fan Animes Rap",
    channelUrl: "https://www.youtube.com/@FaanAnimesRap",
    subscribeUrl: "https://www.youtube.com/@FaanAnimesRap?sub_confirmation=1",
  },
  rock: {
    name: "Fan Animes Rock",
    channelUrl: "https://www.youtube.com/@FanAnimesRock",
    subscribeUrl: "https://www.youtube.com/@FanAnimesRock?sub_confirmation=1",
  },
  sad: {
    name: "Fan Animes Sad",
    channelUrl: "https://www.youtube.com/@FanAnimesSad",
    subscribeUrl: "https://www.youtube.com/@FanAnimesSad?sub_confirmation=1",
  },
  sertanejo: {
    name: "Fan Animes Sertanejo",
    channelUrl: "https://www.youtube.com/@FanAnimesSertanejo",
    subscribeUrl: "https://www.youtube.com/@FanAnimesSertanejo?sub_confirmation=1",
  },
};

export function getYoutubeChannel(link) {
  if (!link || link.icon !== "youtube") {
    throw new Error("Expected a YouTube link");
  }

  const name = typeof link.name === "string" ? link.name.trim() : "";
  const label = typeof link.label === "string" ? link.label.trim() : "";
  const playlistUrl = typeof link.url === "string" ? link.url.trim() : "";
  const subscribeUrl = typeof link.subscribeUrl === "string" ? link.subscribeUrl.trim() : "";

  if (!name || !label || !playlistUrl || !subscribeUrl) {
    throw new Error(`YouTube link missing name, label, playlist url or subscribeUrl: ${link.id ?? link.label}`);
  }

  return { name, label, playlistUrl, subscribeUrl };
}

export function resolveHomeLinkAction(link) {
  if (!link) {
    throw new Error("Missing home link");
  }

  if (link.icon === "youtube") {
    return { type: "youtube-choice", channel: getYoutubeChannel(link) };
  }

  if (typeof link.url !== "string" || !link.url.trim()) {
    throw new Error(`Link missing url: ${link.id ?? link.label}`);
  }

  return { type: "open-url", url: link.url };
}

export function openExternalUrl(url) {
  if (typeof url !== "string" || !url.trim()) {
    throw new Error("Missing URL");
  }

  window.open(url, "_blank", "noopener,noreferrer");
}
