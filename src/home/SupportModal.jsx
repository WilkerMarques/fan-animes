export const DEFAULT_SUPPORT_AMOUNT = 5;
export const SUPPORT_AMOUNTS = [DEFAULT_SUPPORT_AMOUNT, 10, 20];

const COPY_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export function SupportModal({
  qrDataUrl,
  pixCopiaCola,
  supportError,
  supportLoading,
  showOutroInput,
  outroValor,
  copyFeedback,
  selectedAmount,
  onClose,
  onAmount,
  onOutroChange,
  onOutroSubmit,
  onCopyPix,
}) {
  const pixReady = Boolean(qrDataUrl) && !supportLoading;
  const qrState = supportLoading || !supportError ? "Gerando Pix..." : "Pix indisponível";

  return (
    <div className="community-overlay support-overlay" onClick={onClose}>
      <div className="community-card support-theme" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="community-close" onClick={onClose} aria-label="Fechar">×</button>
        <div className="support-body">
          <h2 className="community-title">Apoie Fan Animes</h2>
          <p className="community-subtitle">Curte as playlists? Qualquer valor me ajuda a continuar criando conteúdo.</p>
          <div
            className={`support-qr-wrap${pixReady ? " is-ready" : ""}${supportLoading ? " is-loading" : ""}`}
            aria-busy={supportLoading || undefined}
          >
            <div className="support-qr-inner">
              {pixReady && (
                <img
                  src={qrDataUrl}
                  alt="QR Code Pix"
                  className="support-qr-image"
                />
              )}
              {!pixReady && (
                <span className="support-qr-placeholder">{qrState}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="community-benefit support-copy"
            onClick={onCopyPix}
            disabled={!pixReady || !pixCopiaCola}
            aria-label="Copiar código Pix"
          >
            <span className="community-benefit-icon">{COPY_ICON}</span>
            <span className="community-benefit-text">
              {copyFeedback ? "Copiado!" : pixReady ? "Copiar código Pix" : qrState}
            </span>
          </button>
          <div className="support-amounts">
            {SUPPORT_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                className="community-benefit"
                aria-pressed={selectedAmount === amount}
                onClick={() => onAmount(amount)}
              >
                <span className="community-benefit-text">R$ {amount}</span>
              </button>
            ))}
          </div>
          {supportError && !supportLoading && <p className="support-error">{supportError}</p>}
          {showOutroInput && (
            <div className="support-outro-wrap">
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ex: 15,00"
                value={outroValor}
                onChange={(event) => onOutroChange(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && !supportLoading && onOutroSubmit()}
                className="support-outro-input"
                aria-label="Valor em reais"
              />
            </div>
          )}
          <p className="support-thanks">Obrigado por fazer parte dessa vibe.</p>
        </div>
        <button
          type="button"
          className="community-cta"
          disabled={supportLoading}
          onClick={showOutroInput ? onOutroSubmit : () => onAmount("outro")}
        >
          {supportLoading ? "Gerando Pix..." : showOutroInput ? "Gerar Pix" : "Outro valor"}
        </button>
      </div>
    </div>
  );
}
