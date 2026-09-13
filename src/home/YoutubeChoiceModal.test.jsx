import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { YoutubeChoiceModal } from "./YoutubeChoiceModal";
import { YOUTUBE_CHANNELS } from "./youtubeChannels";

const rockChannel = {
  name: YOUTUBE_CHANNELS.rock.name,
  playlistUrl: "https://www.youtube.com/watch?v=VSb1XQed2Eg&list=PLvnhNp1htaiGxEch5KlLCsgBoMtIktq2p",
  subscribeUrl: YOUTUBE_CHANNELS.rock.subscribeUrl,
};

const mainChannel = {
  name: YOUTUBE_CHANNELS.main.name,
  playlistUrl: "https://www.youtube.com/watch?v=1CKbUddjacA&list=PL0e60EPRepdpV_2OE9RU_KQDGNeyYPAmZ&index=2",
  subscribeUrl: YOUTUBE_CHANNELS.main.subscribeUrl,
};

const sadChannel = {
  name: YOUTUBE_CHANNELS.sad.name,
  playlistUrl: "https://www.youtube.com/watch?v=-4-m8_WQOKE&list=PLJ6M039ljFriVdwXcFK7JNLQvLjcpI12t&index=2",
  subscribeUrl: YOUTUBE_CHANNELS.sad.subscribeUrl,
};

const sertanejoChannel = {
  name: YOUTUBE_CHANNELS.sertanejo.name,
  playlistUrl: "https://www.youtube.com/watch?v=A0IgMeWC4mo&list=PLMh0IjZtWn6xdoT1bMNBJ3NKE-OZkxwjw&index=4",
  subscribeUrl: YOUTUBE_CHANNELS.sertanejo.subscribeUrl,
};

const rapChannel = {
  name: YOUTUBE_CHANNELS.rap.name,
  playlistUrl: "https://www.youtube.com/watch?v=mzRLZHzeQUs&list=PLimPNI2iN0Jf4ZazKK6sq9s0htEwGcQvy",
  subscribeUrl: YOUTUBE_CHANNELS.rap.subscribeUrl,
};

describe("YoutubeChoiceModal", () => {
  let openSpy;
  let onTrack;

  beforeEach(() => {
    openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
    onTrack = jest.fn();
  });

  afterEach(() => {
    openSpy.mockRestore();
  });

  test("shows the selected channel and dialog accessibility attributes", () => {
    render(
      <YoutubeChoiceModal channel={sadChannel} onClose={jest.fn()} onTrack={onTrack} />
    );

    const dialog = screen.getByRole("dialog", { name: "Fan Animes Sad" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("O que você deseja fazer?")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
  });

  test("opens the playlist URL and closes the modal", async () => {
    const onClose = jest.fn();
    render(<YoutubeChoiceModal channel={rockChannel} onClose={onClose} onTrack={onTrack} />);

    await userEvent.click(screen.getByRole("button", { name: "Abrir canal" }));

    expect(onTrack).toHaveBeenCalledWith(rockChannel);
    expect(openSpy).toHaveBeenCalledWith(
      rockChannel.playlistUrl,
      "_blank",
      "noopener,noreferrer"
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("opens the subscribe URL and closes the modal", async () => {
    const onClose = jest.fn();
    render(<YoutubeChoiceModal channel={mainChannel} onClose={onClose} onTrack={onTrack} />);

    await userEvent.click(screen.getByRole("button", { name: "Inscrever-se" }));

    expect(onTrack).toHaveBeenCalledWith(mainChannel);

    expect(openSpy).toHaveBeenCalledWith(
      YOUTUBE_CHANNELS.main.subscribeUrl,
      "_blank",
      "noopener,noreferrer"
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("closes from the stay link, X, overlay and Escape", async () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <YoutubeChoiceModal channel={sertanejoChannel} onClose={onClose} onTrack={onTrack} />
    );

    await userEvent.click(screen.getByRole("button", { name: "Continuar no site" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onTrack).not.toHaveBeenCalled();

    rerender(<YoutubeChoiceModal channel={sertanejoChannel} onClose={onClose} onTrack={onTrack} />);
    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onClose).toHaveBeenCalledTimes(2);

    rerender(<YoutubeChoiceModal channel={sertanejoChannel} onClose={onClose} onTrack={onTrack} />);
    fireEvent.click(document.querySelector(".youtube-choice-overlay"));
    expect(onClose).toHaveBeenCalledTimes(3);

    rerender(<YoutubeChoiceModal channel={sertanejoChannel} onClose={onClose} onTrack={onTrack} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(4);
    expect(onTrack).not.toHaveBeenCalled();
  });

  test("returns focus to the opening card", async () => {
    const opener = document.createElement("button");
    opener.textContent = "open";
    document.body.appendChild(opener);
    const returnFocusRef = { current: opener };
    const onClose = jest.fn();

    const { unmount } = render(
      <YoutubeChoiceModal
        channel={rapChannel}
        onClose={onClose}
        onTrack={onTrack}
        returnFocusRef={returnFocusRef}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Continuar no site" }));
    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
