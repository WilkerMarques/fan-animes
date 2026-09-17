import { buildHeaderSocials, HEADER_SOCIAL_LABELS } from "./headerSocials";

const links = [
  { icon: "spotify", genre: "main", url: "https://open.spotify.com/playlist/main" },
  { icon: "youtube", genre: "main", url: "https://www.youtube.com/@faananimes" },
  { icon: "spotify", genre: "rap", url: "https://open.spotify.com/playlist/rap" },
  { icon: "youtube", genre: "rap", url: "https://www.youtube.com/@FaanAnimesRap" },
];

const whatsappUrl = "https://whatsapp.com/channel/0029VbBZmWaATRSrIGVtpS36";

describe("buildHeaderSocials", () => {
  test("puts WhatsApp to the right of YouTube with the community URL", () => {
    const socials = buildHeaderSocials({ links, genre: "main", whatsappUrl });

    expect(socials.map((item) => item.icon)).toEqual(["spotify", "youtube", "whatsapp"]);
    expect(socials[2]).toEqual({
      icon: "whatsapp",
      url: whatsappUrl,
      label: HEADER_SOCIAL_LABELS.whatsapp,
    });
  });

  test("uses the socials of the landing genre", () => {
    const socials = buildHeaderSocials({ links, genre: "rap", whatsappUrl });
    expect(socials[0].url).toBe("https://open.spotify.com/playlist/rap");
    expect(socials[1].url).toBe("https://www.youtube.com/@FaanAnimesRap");
    expect(socials[2].url).toBe(whatsappUrl);
  });

  test("fails without the community URL", () => {
    expect(() => buildHeaderSocials({ links, genre: "main", whatsappUrl: "" })).toThrow(
      "WhatsApp community URL is required"
    );
  });
});
