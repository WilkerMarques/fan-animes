import { buildMobileHomeLinks, MOBILE_WHATSAPP_CARD } from "./mobileHomeLinks";

const whatsappUrl = "https://whatsapp.com/channel/0029VbBZmWaATRSrIGVtpS36";

const links = [
  { id: 1, icon: "spotify", label: "Fan Animes" },
  { id: 5, icon: "youtube", label: "Fan Animes" },
  { id: 9, icon: "instagram", label: "Fan Animes" },
  { id: 10, icon: "tiktok", label: "Fan Animes" },
];

describe("buildMobileHomeLinks", () => {
  test("puts the WhatsApp community card above Instagram", () => {
    const mobileLinks = buildMobileHomeLinks(links, whatsappUrl);

    expect(mobileLinks.map((link) => link.icon)).toEqual([
      "spotify",
      "youtube",
      "whatsapp",
      "instagram",
      "tiktok",
    ]);
    expect(mobileLinks[2]).toEqual({
      ...MOBILE_WHATSAPP_CARD,
      url: whatsappUrl,
    });
  });

  test("fails without the community URL", () => {
    expect(() => buildMobileHomeLinks(links, "")).toThrow("WhatsApp community URL is required");
  });

  test("fails without Instagram", () => {
    expect(() => buildMobileHomeLinks(links.filter((link) => link.icon !== "instagram"), whatsappUrl)).toThrow(
      "Instagram card is required to place WhatsApp"
    );
  });
});
