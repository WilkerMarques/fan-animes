import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./FanAnimesOficial";
import { YOUTUBE_CHANNELS } from "./home/youtubeChannels";

beforeEach(() => {
  if (!document.querySelector("script")) {
    document.head.appendChild(document.createElement("script"));
  }
  jest.spyOn(window, "open").mockImplementation(() => null);
  jest.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({}),
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

test("opens the YouTube choice modal from a channel card", async () => {
  await renderHome();

  const youtubeCards = screen.getAllByRole("button", { name: "🔥 Fan Animes" });
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
    { label: "🎤 Fan Animes Rap", name: YOUTUBE_CHANNELS.rap.name },
    { label: "🎸 Fan Animes Rock", name: YOUTUBE_CHANNELS.rock.name },
    { label: "😢 Fan Animes Sad", name: YOUTUBE_CHANNELS.sad.name },
    { label: "🤠 Fan Animes Sertanejo", name: YOUTUBE_CHANNELS.sertanejo.name },
  ];

  for (const item of cases) {
    const cards = screen.getAllByRole("button", { name: item.label });
    await userEvent.click(cards[cards.length - 1]);
    expect(screen.getByRole("dialog", { name: item.name })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Continuar no site" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  }
});

test("keeps Spotify cards opening the playlist URL", async () => {
  await renderHome();

  const spotifyCard = screen.getAllByRole("button", { name: "🔥 Fan Animes" })[0];
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
