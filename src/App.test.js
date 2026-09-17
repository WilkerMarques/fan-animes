import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./FanAnimesOficial";
import { YOUTUBE_CHANNELS } from "./home/youtubeChannels";

jest.mock("./home/pixQr", () => ({
  __esModule: true,
  buildPixQrDataUrl: (copia) => {
    if (!copia) {
      throw new Error("Pix copia e cola vazio.");
    }
    return Promise.resolve("data:image/png;base64,pix");
  },
}));

beforeEach(() => {
  if (!document.querySelector("script")) {
    document.head.appendChild(document.createElement("script"));
  }
  delete window.fbq;
  delete window.__fanAnimesMetaPixelId;
  delete window.__fanAnimesLastPageViewKey;
  jest.spyOn(window, "open").mockImplementation(() => null);
  jest.spyOn(global, "fetch").mockImplementation((input) => {
    const url = String(input);
    if (url.includes("pix-copia-cola")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ copiaCola: "00020126fan-animes-pix" }),
      });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function renderHome() {
  const view = render(<App />);
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalled();
  });
  return view;
}

function getYoutubeCards(label) {
  return screen.getAllByRole("button", { name: label }).filter((card) =>
    card.querySelector(".link-icon")?.style.color === "rgb(255, 0, 0)"
  );
}

test("opens the YouTube choice modal from a channel card", async () => {
  await renderHome();

  const youtubeCards = getYoutubeCards("Fan Animes");
  await userEvent.click(youtubeCards[youtubeCards.length - 1]);

  expect(screen.getByRole("dialog", { name: YOUTUBE_CHANNELS.main.name })).toBeInTheDocument();
  expect(window.open).not.toHaveBeenCalled();

  await userEvent.click(screen.getByRole("button", { name: "Abrir canal" }));
  expect(window.open).toHaveBeenCalledWith(
    expect.stringContaining("v=1CKbUddjacA&list=PL0e60EPRepdpV_2OE9RU_KQDGNeyYPAmZ"),
    "_blank",
    "noopener,noreferrer"
  );
});

test("shows a different YouTube channel for each genre card", async () => {
  await renderHome();

  const cases = [
    { label: "Fan Animes Rap", name: YOUTUBE_CHANNELS.rap.name },
    { label: "Fan Animes Rock", name: YOUTUBE_CHANNELS.rock.name },
    { label: "Fan Animes Sad", name: YOUTUBE_CHANNELS.sad.name },
    { label: "Fan Animes Sertanejo", name: YOUTUBE_CHANNELS.sertanejo.name },
  ];

  for (const item of cases) {
    const cards = screen.getAllByRole("button", { name: item.label });
    await userEvent.click(cards[cards.length - 1]);
    expect(screen.getByRole("dialog", { name: item.name })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Continuar no site" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  }
});

test("shows WhatsApp to the right of YouTube and opens the community link", async () => {
  await renderHome();

  const whatsapp = screen.getByRole("link", { name: "WhatsApp Comunidade" });
  expect(whatsapp).toHaveAttribute("href", "https://whatsapp.com/channel/0029VbBZmWaATRSrIGVtpS36");
  expect(whatsapp).toHaveAttribute("target", "_blank");

  const socials = whatsapp.parentElement;
  const icons = Array.from(socials.querySelectorAll("a")).map((link) => link.getAttribute("aria-label"));
  expect(icons).toEqual(["Spotify", "YouTube", "WhatsApp Comunidade"]);
});

test("fires the pixel when the header WhatsApp icon is clicked", async () => {
  window.fbq = jest.fn();
  global.fetch.mockImplementation((url) => {
    if (String(url).includes("pixel-config")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ pixelId: "1736644321794726", active: true }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({}),
    });
  });

  await renderHome();
  await waitFor(() => expect(window.fbq).toHaveBeenCalled());

  await userEvent.click(screen.getByRole("link", { name: "WhatsApp Comunidade" }));

  expect(window.fbq).toHaveBeenCalledWith("trackCustom", "ClickButton", {
    content_name: "WhatsApp Comunidade",
    content_category: "whatsapp",
  });
});

function getCardsByIconColor(label, color) {
  return screen.getAllByRole("button", { name: label }).filter((card) =>
    card.querySelector(".link-icon")?.style.color === color
  );
}

test("shows a WhatsApp community card only in the mobile list, above Instagram", async () => {
  await renderHome();

  const whatsappCards = getCardsByIconColor("Fan Animes", "rgb(37, 211, 102)");
  expect(whatsappCards).toHaveLength(1);
  expect(whatsappCards[0].closest(".links-wrap")).toBeTruthy();
  expect(whatsappCards[0].closest(".desktop-home")).toBeNull();

  const mobileCards = Array.from(document.querySelectorAll(".links-wrap [role='button']"));
  const whatsappIndex = mobileCards.indexOf(whatsappCards[0]);
  const instagramIndex = mobileCards.findIndex((card) =>
    card.querySelector(".link-icon")?.style.color === "rgb(225, 48, 108)"
  );
  expect(whatsappIndex).toBe(instagramIndex - 1);
});

test("fires the pixel when the mobile WhatsApp card is clicked", async () => {
  window.fbq = jest.fn();
  global.fetch.mockImplementation((url) => {
    if (String(url).includes("pixel-config")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ pixelId: "1736644321794726", active: true }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({}),
    });
  });

  await renderHome();
  await waitFor(() => expect(window.fbq).toHaveBeenCalled());

  const whatsappCard = getCardsByIconColor("Fan Animes", "rgb(37, 211, 102)")[0];
  await userEvent.click(whatsappCard);

  expect(window.fbq).toHaveBeenCalledWith("trackCustom", "ClickButton", {
    content_name: "Fan Animes",
    content_category: "whatsapp",
  });
  await waitFor(() => {
    expect(window.open).toHaveBeenCalledWith(
      "https://whatsapp.com/channel/0029VbBZmWaATRSrIGVtpS36",
      "_blank",
      "noopener,noreferrer"
    );
  });
});

test("keeps Spotify cards opening the playlist URL", async () => {
  await renderHome();

  const spotifyCard = screen.getAllByRole("button", { name: "Fan Animes" })[0];
  await userEvent.click(spotifyCard);

  await waitFor(() => {
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("open.spotify.com"),
      "_blank",
      "noopener,noreferrer"
    );
  });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("opens Apoie with the community modal pattern", async () => {
  await renderHome();

  await userEvent.click(screen.getByRole("button", { name: "Apoie" }));

  expect(screen.getByRole("heading", { name: "Apoie Fan Animes" })).toHaveClass("community-title");
  expect(screen.getByRole("button", { name: "R$ 5" })).toHaveClass("community-benefit");
  expect(screen.getByRole("button", { name: "R$ 5" })).toHaveAttribute("aria-pressed", "true");

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("pix-copia-cola?valor=5"),
      expect.any(Object)
    );
  });
  await waitFor(() => {
    expect(screen.getByAltText("QR Code Pix")).toBeInTheDocument();
  });
  expect(screen.getByRole("button", { name: "Copiar código Pix" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Outro valor" })).toHaveClass("community-cta");
  expect(screen.getByRole("button", { name: "Copiar código Pix" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Outro valor" })).toHaveClass("community-cta");

  await userEvent.click(screen.getByRole("button", { name: "Outro valor" }));

  expect(screen.getByLabelText("Valor em reais")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Gerar Pix" })).toHaveClass("community-cta");
});

test("regenerates Pix when a preset amount changes", async () => {
  await renderHome();

  await userEvent.click(screen.getByRole("button", { name: "Apoie" }));
  await waitFor(() => {
    expect(screen.getByAltText("QR Code Pix")).toBeInTheDocument();
  });

  await userEvent.click(screen.getByRole("button", { name: "R$ 10" }));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("pix-copia-cola?valor=10"),
      expect.any(Object)
    );
  });
  expect(screen.getByRole("button", { name: "R$ 10" })).toHaveAttribute("aria-pressed", "true");
  await waitFor(() => {
    expect(screen.getByAltText("QR Code Pix")).toBeInTheDocument();
  });
});

test("generates Pix for the custom amount typed", async () => {
  await renderHome();

  await userEvent.click(screen.getByRole("button", { name: "Apoie" }));
  await waitFor(() => {
    expect(screen.getByAltText("QR Code Pix")).toBeInTheDocument();
  });

  await userEvent.click(screen.getByRole("button", { name: "Outro valor" }));
  await userEvent.type(screen.getByLabelText("Valor em reais"), "15,00");
  await userEvent.click(screen.getByRole("button", { name: "Gerar Pix" }));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("pix-copia-cola?valor=15"),
      expect.any(Object)
    );
  });
  await waitFor(() => {
    expect(screen.getByAltText("QR Code Pix")).toBeInTheDocument();
  });
});

test("shows the API error and hides the previous QR when generating fails", async () => {
  let pixCalls = 0;
  global.fetch.mockImplementation((input) => {
    const url = String(input);
    if (url.includes("pix-copia-cola")) {
      pixCalls += 1;
      if (pixCalls === 1) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ copiaCola: "00020126fan-animes-pix" }),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 503,
        json: async () => ({
          error: "Pix não configurado. Adicione pix_chave_aleatoria em config.local.php com sua chave Pix (Inter).",
        }),
      });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
  });

  await renderHome();
  await userEvent.click(screen.getByRole("button", { name: "Apoie" }));
  await waitFor(() => {
    expect(screen.getByAltText("QR Code Pix")).toBeInTheDocument();
  });

  await userEvent.click(screen.getByRole("button", { name: "R$ 20" }));

  await waitFor(() => {
    expect(screen.getByText(/Pix não configurado/)).toBeInTheDocument();
  });
  expect(screen.queryByAltText("QR Code Pix")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Copiar código Pix" })).toBeDisabled();
});

test("rejects an empty custom Pix amount", async () => {
  await renderHome();

  await userEvent.click(screen.getByRole("button", { name: "Apoie" }));
  await waitFor(() => {
    expect(screen.getByAltText("QR Code Pix")).toBeInTheDocument();
  });

  await userEvent.click(screen.getByRole("button", { name: "Outro valor" }));
  await userEvent.click(screen.getByRole("button", { name: "Gerar Pix" }));

  expect(screen.getByText("Informe um valor em reais.")).toBeInTheDocument();
  expect(screen.queryByAltText("QR Code Pix")).not.toBeInTheDocument();
});

test("keeps the mobile Apoie and Comunidade balloons together at the same size", async () => {
  await renderHome();

  const support = screen.getByRole("button", { name: "Apoie" });
  const community = screen.getByRole("button", { name: "Comunidade" });

  expect(support.parentElement).toBe(community.parentElement);
  expect(support.parentElement).toHaveClass("mobile-float-bar");
  expect(support.compareDocumentPosition(community) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
