import { useEffect, useRef } from "react";
import { openExternalUrl } from "./youtubeChannels";

const YOUTUBE_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const EXTERNAL_ICON = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 4h6v6" />
    <path d="M10 14 20 4" />
    <path d="M18 14v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </svg>
);

function getFocusableElements(root) {
  return Array.from(
    root.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");
}

export function YoutubeChoiceModal({ channel, onClose, onTrack, returnFocusRef }) {
  const dialogRef = useRef(null);
  const titleId = "youtube-choice-title";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      throw new Error("YouTube choice dialog is not mounted");
    }

    const opener = returnFocusRef?.current;
    const focusable = getFocusableElements(dialog);
    if (focusable[0]) {
      focusable[0].focus();
    } else {
      dialog.focus();
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const items = getFocusableElements(dialog);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (opener && typeof opener.focus === "function") {
        opener.focus();
      }
    };
  }, [onClose, returnFocusRef]);

  function trackChoice() {
    if (typeof onTrack !== "function") {
      throw new Error("YouTube choice modal missing onTrack");
    }
    onTrack(channel);
  }

  function handleOpenChannel() {
    trackChoice();
    openExternalUrl(channel.playlistUrl);
    onClose();
  }

  function handleSubscribe() {
    trackChoice();
    openExternalUrl(channel.subscribeUrl);
    onClose();
  }

  return (
    <div className="youtube-choice-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="youtube-choice-frame"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="youtube-choice-card">
          <button type="button" className="youtube-choice-close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
          <span className="youtube-choice-icon">{YOUTUBE_ICON}</span>
          <h2 id={titleId} className="youtube-choice-name">
            {channel.name}
          </h2>
          <p className="youtube-choice-prompt">O que você deseja fazer?</p>
          <div className="youtube-choice-actions">
            <button type="button" className="youtube-choice-secondary" onClick={handleOpenChannel}>
              {EXTERNAL_ICON}
              Abrir canal
            </button>
            <button type="button" className="youtube-choice-primary" onClick={handleSubscribe}>
              {YOUTUBE_ICON}
              Inscrever-se
            </button>
          </div>
          <button type="button" className="youtube-choice-stay" onClick={onClose}>
            Continuar no site
          </button>
        </div>
      </div>
      <style>{`
        .youtube-choice-overlay{position:fixed;inset:0;z-index:9998;background:rgba(8,11,16,0.45);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px}
        .youtube-choice-frame{width:min(420px,100%);border-radius:28px;padding:1px;background:linear-gradient(135deg,#ff3e6c 0%,#7c3aed 100%);box-shadow:0 24px 64px rgba(0,0,0,0.55),0 0 28px rgba(255,62,108,0.12),0 0 22px rgba(124,58,237,0.12)}
        .youtube-choice-card{position:relative;background:rgba(10,12,20,0.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-radius:27px;padding:28px 28px 22px;width:100%;display:flex;flex-direction:column;align-items:center}
        .youtube-choice-close{position:absolute;top:14px;right:16px;width:28px;height:28px;border:none;background:transparent;color:#c9d4e0;cursor:pointer;font-size:22px;line-height:1;transition:color 0.2s}
        .youtube-choice-close:hover,.youtube-choice-close:focus-visible{color:#fff;outline:none}
        .youtube-choice-icon{display:inline-flex;align-items:center;justify-content:center;color:#ff0000;margin-bottom:10px}
        .youtube-choice-icon svg{width:18px;height:18px}
        .youtube-choice-name{font-family:'Noto Sans JP',sans-serif;font-weight:600;font-size:1.35rem;color:#fff;text-align:center;margin:0 0 8px;line-height:1.25}
        .youtube-choice-prompt{font-size:0.92rem;color:#8b9bb0;text-align:center;margin:0 0 22px;line-height:1.4}
        .youtube-choice-actions{display:flex;justify-content:center;align-items:center;gap:12px;margin-bottom:16px;width:100%}
        .youtube-choice-secondary,.youtube-choice-primary{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 18px;border-radius:999px;font-size:0.92rem;font-weight:600;font-family:inherit;cursor:pointer;transition:all 0.2s;white-space:nowrap}
        .youtube-choice-secondary{background:rgba(8,11,16,0.75);border:1.5px solid rgba(255,255,255,0.88);color:#fff}
        .youtube-choice-secondary:hover,.youtube-choice-secondary:focus-visible{background:rgba(255,255,255,0.08);outline:none}
        .youtube-choice-primary{background:#ff0000;border:1.5px solid #ff0000;color:#fff}
        .youtube-choice-primary:hover,.youtube-choice-primary:focus-visible{background:#e60000;outline:none}
        .youtube-choice-primary .youtube-choice-icon,.youtube-choice-secondary svg{margin:0;color:currentColor}
        .youtube-choice-primary svg{width:15px;height:15px;color:#fff}
        .youtube-choice-stay{display:block;border:none;background:none;color:#7b8898;font-size:0.82rem;cursor:pointer;padding:4px 0 0;font-family:inherit}
        .youtube-choice-stay:hover,.youtube-choice-stay:focus-visible{color:#c9d4e0;outline:none}
        @media (max-width:640px){
          .youtube-choice-overlay{padding:16px}
          .youtube-choice-actions{flex-direction:column}
          .youtube-choice-secondary,.youtube-choice-primary{width:100%}
        }
      `}</style>
    </div>
  );
}
