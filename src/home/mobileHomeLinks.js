export const MOBILE_WHATSAPP_CARD = {
  id: "whatsapp-community-mobile",
  genre: "social",
  label: "Fan Animes",
  sub: null,
  icon: "whatsapp",
  color: "#25D366",
};

export function buildMobileHomeLinks(links, whatsappUrl) {
  if (!whatsappUrl) {
    throw new Error("WhatsApp community URL is required");
  }

  const instagramIndex = links.findIndex((link) => link.icon === "instagram");
  if (instagramIndex === -1) {
    throw new Error("Instagram card is required to place WhatsApp");
  }

  return [
    ...links.slice(0, instagramIndex),
    { ...MOBILE_WHATSAPP_CARD, url: whatsappUrl },
    ...links.slice(instagramIndex),
  ];
}
