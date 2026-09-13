import { useEffect, useMemo, useState } from "react";
import { canSavePixelConfig, isValidMetaPixelId, normalizeMetaPixelId } from "../home/pixelId";
import { fetchAdminPixelConfig, saveAdminPixelConfig } from "../home/pixelConfigApi";

const emptyForm = { pixelId: "", active: false };

function configsEqual(a, b) {
  return normalizeMetaPixelId(a.pixelId) === normalizeMetaPixelId(b.pixelId) && Boolean(a.active) === Boolean(b.active);
}

export function PixelConfigSection({ onUnauthorized, confirmDeactivate = window.confirm.bind(window) }) {
  const [saved, setSaved] = useState(emptyForm);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await fetchAdminPixelConfig();
        if (cancelled) return;
        if (result.unauthorized) {
          onUnauthorized();
          return;
        }
        setSaved(result.data);
        setForm({ pixelId: result.data.pixelId, active: result.data.active });
      } catch (e) {
        if (!cancelled) setError(e.message || "Não foi possível carregar a configuração do Pixel.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onUnauthorized]);

  const dirty = useMemo(() => !configsEqual(form, saved), [form, saved]);
  const valid = canSavePixelConfig(form);
  const idError = form.pixelId !== "" && !isValidMetaPixelId(form.pixelId);
  const activeWithoutId = form.active && !isValidMetaPixelId(form.pixelId);
  const canSubmit = dirty && valid && !saving && !loading;

  const restore = () => {
    setForm({ pixelId: saved.pixelId, active: saved.active });
    setSuccess("");
    setError("");
  };

  const submit = async () => {
    if (!canSubmit) return;
    if (saved.active && !form.active) {
      const confirmed = confirmDeactivate("Desativar o Pixel? O site deixará de enviar eventos de rastreamento.");
      if (!confirmed) return;
    }

    setSaving(true);
    setSuccess("");
    setError("");

    try {
      const result = await saveAdminPixelConfig(form);
      if (result.unauthorized) {
        onUnauthorized();
        return;
      }
      setSaved(result.data);
      setForm({ pixelId: result.data.pixelId, active: result.data.active });
      setSuccess("Configuração do Pixel salva.");
    } catch (e) {
      setError(e.message || "Não foi possível salvar a configuração do Pixel.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        padding: "20px 16px",
        marginTop: 28,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ fontSize: "0.75rem", color: "#4a6a7a", letterSpacing: "0.05em" }}>
          CONFIGURAÇÃO DO PIXEL
        </div>
        <div
          style={{
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            padding: "4px 10px",
            borderRadius: 20,
            color: saved.active ? "#00d4ff" : "#7a9bbf",
            background: saved.active ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.04)",
            border: saved.active ? "1px solid rgba(0,212,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {saved.active ? "ATIVO" : "INATIVO"}
        </div>
      </div>

      {loading ? (
        <div style={{ color: "#4a6a7a", fontSize: "0.8rem", textAlign: "center", padding: 20 }}>
          Carregando configuração...
        </div>
      ) : (
        <>
          <label style={{ display: "block", marginBottom: 14 }}>
            <div style={{ fontSize: "0.72rem", color: "#7a9bbf", marginBottom: 6 }}>ID do Pixel</div>
            <input
              value={form.pixelId}
              onChange={(e) => setForm((prev) => ({ ...prev, pixelId: e.target.value }))}
              placeholder="Somente o ID numérico do Meta Pixel"
              inputMode="numeric"
              autoComplete="off"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px",
                borderRadius: 10,
                border: idError || activeWithoutId ? "1px solid #ff3e6c" : "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: "#d4eaf7",
                fontSize: "0.9rem",
              }}
            />
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: "#7a9bbf", fontSize: "0.8rem" }}>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
            />
            Pixel ativo
          </label>

          {(idError || activeWithoutId) && (
            <div style={{ color: "#ff3e6c", fontSize: "0.75rem", marginBottom: 12 }}>
              {idError
                ? "Use só o ID numérico do Meta Pixel (10 a 20 dígitos). Scripts não são aceitos."
                : "Informe um ID válido para ativar o Pixel."}
            </div>
          )}

          {success && (
            <div style={{ color: "#34d399", fontSize: "0.75rem", marginBottom: 12 }}>{success}</div>
          )}
          {error && (
            <div style={{ color: "#ff3e6c", fontSize: "0.75rem", marginBottom: 12 }}>{error}</div>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              style={{
                background: canSubmit ? "linear-gradient(135deg,#00d4ff,#a855f7)" : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: canSubmit ? "#fff" : "#4a6a7a",
                padding: "8px 16px",
                borderRadius: 8,
                cursor: canSubmit ? "pointer" : "not-allowed",
                fontSize: "0.8rem",
                fontWeight: 700,
              }}
            >
              {saving ? "Salvando..." : "Salvar configuração"}
            </button>
            <button
              type="button"
              onClick={restore}
              disabled={!dirty || saving}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: dirty && !saving ? "#7a9bbf" : "#4a6a7a",
                padding: "8px 16px",
                borderRadius: 8,
                cursor: dirty && !saving ? "pointer" : "not-allowed",
                fontSize: "0.8rem",
              }}
            >
              Cancelar/restaurar valor atual
            </button>
          </div>
        </>
      )}
    </section>
  );
}
