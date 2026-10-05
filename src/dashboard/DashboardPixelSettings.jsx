import { PixelConfigSection } from "./PixelConfigSection";

export function DashboardPixelSettings({ onBack, onUnauthorized }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080b10",
        color: "#d4eaf7",
        fontFamily: "'Noto Sans JP',sans-serif",
        padding: "24px 16px 60px",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Orbitron',monospace",
                fontSize: "1.1rem",
                fontWeight: 900,
                color: "#00d4ff",
                letterSpacing: "0.1em",
              }}
            >
              CONFIGURAÇÃO DO PIXEL
            </div>
            <div style={{ fontSize: "0.72rem", color: "#4a6a7a", marginTop: 4 }}>
              Meta Pixel por página · até 5 IDs por rota
            </div>
          </div>
          <button
            type="button"
            onClick={onBack}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#7a9bbf",
              padding: "8px 16px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "0.8rem",
              flexShrink: 0,
            }}
          >
            Voltar
          </button>
        </div>
        <PixelConfigSection onUnauthorized={onUnauthorized} embedded />
      </div>
    </div>
  );
}
