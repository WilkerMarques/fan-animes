export const HEADER_SOCIAL_LABELS = {
  spotify: "Spotify",
  youtube: "YouTube",
  whatsapp: "WhatsApp Comunidade",
};

export function buildHeaderSocials({ links, genre, whatsappUrl }) {
  const spotify = links.find((l) => l.icon === "spotify" && l.genre === genre);
  const youtube = links.find((l) => l.icon === "youtube" && l.genre === genre);
  if (!spotify || !youtube) {
    throw new Error("Landing socials missing for genre: " + genre);
  }
  if (!whatsappUrl) {
    throw new Error("WhatsApp community URL is required");
  }
  return [
    { icon: "spotify", url: spotify.url, label: HEADER_SOCIAL_LABELS.spotify },
    { icon: "youtube", url: youtube.url, label: HEADER_SOCIAL_LABELS.youtube },
    { icon: "whatsapp", url: whatsappUrl, label: HEADER_SOCIAL_LABELS.whatsapp },
  ];
}
