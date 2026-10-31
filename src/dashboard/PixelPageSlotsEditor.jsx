import { isValidMetaPixelId, normalizeMetaPixelId, PIXEL_ID_MAX_LENGTH } from "../home/pixelId";

function slotFieldError(slot) {
  const id = normalizeMetaPixelId(slot.pixelId);
  if (id !== "" && !isValidMetaPixelId(id)) {
    if (id.length > PIXEL_ID_MAX_LENGTH) {
      return `Use no máximo ${PIXEL_ID_MAX_LENGTH} caracteres.`;
    }
    return "ID inválido. Não use tags HTML, scripts ou javascript:.";
  }
  if (slot.active && !isValidMetaPixelId(id)) {
    return "Informe um ID válido para ativar este slot.";
  }
  return "";
}

export function PixelPageSlotsEditor({ slots, onChange, disabled, providerKey = "meta" }) {
  const placeholder =
    providerKey === "openai"
      ? "ID OpenAI (ex.: MCJXHhHwXwLQLYxMWbCEAs)"
      : "ID Meta (ex.: 1736644321794726)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {slots.map((slot, index) => {
        const error = slotFieldError(slot);
        return (
          <div
            key={slot.slot ?? index + 1}
            style={{
              padding: 12,
              borderRadius: 10,
              border: error ? "1px solid rgba(255,62,108,0.5)" : "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div style={{ fontSize: "0.68rem", color: "#4a6a7a", marginBottom: 8, letterSpacing: "0.04em" }}>
              PIXEL {index + 1}
            </div>
            <input
              value={slot.pixelId}
              disabled={disabled}
              onChange={(e) => {
                const next = slots.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, pixelId: e.target.value } : item
                );
                onChange(next);
              }}
              placeholder={placeholder}
              maxLength={PIXEL_ID_MAX_LENGTH}
              autoComplete="off"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 12px",
                borderRadius: 8,
                border: error ? "1px solid #ff3e6c" : "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: "#d4eaf7",
                fontSize: "0.85rem",
                marginBottom: 8,
              }}
            />
            <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#7a9bbf", fontSize: "0.78rem" }}>
              <input
                type="checkbox"
                disabled={disabled}
                checked={Boolean(slot.active)}
                onChange={(e) => {
                  const next = slots.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, active: e.target.checked } : item
                  );
                  onChange(next);
                }}
                aria-label={`Ativar pixel ${index + 1}`}
              />
              Ativo nesta página
            </label>
            {error && (
              <div style={{ color: "#ff3e6c", fontSize: "0.72rem", marginTop: 8 }}>{error}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
