import { render, screen } from "@testing-library/react";
import { SupportModal } from "./SupportModal";

const noop = () => {};

function renderSupportModal(props = {}) {
  return render(
    <SupportModal
      qrDataUrl=""
      pixCopiaCola=""
      supportError=""
      supportLoading={false}
      showOutroInput={false}
      outroValor=""
      copyFeedback={false}
      selectedAmount={5}
      onClose={noop}
      onAmount={noop}
      onOutroChange={noop}
      onOutroSubmit={noop}
      onCopyPix={noop}
      {...props}
    />
  );
}

test("shows a ready Pix QR and copy action for R$ 5", () => {
  renderSupportModal({
    qrDataUrl: "data:image/png;base64,pix",
    pixCopiaCola: "00020126fan-animes-pix",
  });

  expect(screen.getByAltText("QR Code Pix")).toHaveClass("support-qr-image");
  expect(screen.getByAltText("QR Code Pix").closest(".support-qr-wrap")).toHaveClass("is-ready");
  expect(screen.getByRole("button", { name: "Copiar código Pix" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "R$ 5" })).toHaveAttribute("aria-pressed", "true");
});

test("keeps copy disabled while the Pix is generating", () => {
  renderSupportModal();

  expect(screen.getByRole("button", { name: "Copiar código Pix" })).toBeDisabled();
  expect(screen.queryByAltText("QR Code Pix")).not.toBeInTheDocument();
  expect(document.querySelector(".support-qr-wrap")).not.toHaveClass("is-ready");
});

test("hides the previous QR and shows loading when generating another amount", () => {
  renderSupportModal({
    qrDataUrl: "data:image/png;base64,pix",
    pixCopiaCola: "00020126fan-animes-pix",
    supportLoading: true,
    selectedAmount: 10,
  });

  expect(screen.queryByAltText("QR Code Pix")).not.toBeInTheDocument();
  expect(document.querySelector(".support-qr-placeholder")).toHaveTextContent("Gerando Pix...");
  expect(document.querySelector(".support-qr-wrap")).toHaveClass("is-loading");
  expect(document.querySelector(".support-qr-wrap")).toHaveAttribute("aria-busy", "true");
  expect(screen.getByRole("button", { name: "Copiar código Pix" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Gerando Pix..." })).toBeDisabled();
});

test("shows the API error instead of the previous QR", () => {
  renderSupportModal({
    qrDataUrl: "",
    pixCopiaCola: "",
    supportError: "Pix não configurado. Adicione pix_chave_aleatoria em config.local.php com sua chave Pix (Inter).",
  });

  expect(screen.queryByAltText("QR Code Pix")).not.toBeInTheDocument();
  expect(document.querySelector(".support-qr-placeholder")).toHaveTextContent("Pix indisponível");
  expect(screen.getByText(/Pix não configurado/)).toBeInTheDocument();
});
