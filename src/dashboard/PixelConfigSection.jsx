import { useEffect, useMemo, useState } from "react";
import {
  emptyPagesPixelForm,
  PIXEL_LANDING_PAGES,
  PIXEL_LANDING_PAGE_KEYS,
  PIXEL_PROVIDERS,
  PIXEL_PROVIDER_KEYS,
} from "../home/landingPages";
import { canSavePixelSlots } from "../home/pixelId";
import { fetchAdminPixelConfig, saveAdminPixelPages } from "../home/pixelConfigApi";
import { PixelPageSlotsEditor } from "./PixelPageSlotsEditor";

function adminDataToForm(data) {
  const base = emptyPagesPixelForm();
  if (!data?.pages) {
    return base;
  }
  for (const pageKey of PIXEL_LANDING_PAGE_KEYS) {
    const page = data.pages[pageKey];
    if (!page?.providers) {
      continue;
    }
    for (const providerKey of PIXEL_PROVIDER_KEYS) {
      const slots = page.providers[providerKey]?.slots;
      if (!Array.isArray(slots)) {
        continue;
      }
      base[pageKey][providerKey] = slots.map((slot, index) => ({
        slot: slot.slot ?? index + 1,
        pixelId: slot.pixelId ?? "",
        active: Boolean(slot.active),
      }));
    }
  }
  return base;
}

function slotsEqual(left, right) {
  if (left.length !== right.length) {
    return false;
  }
  return left.every(
    (slot, index) =>
      slot.pixelId === right[index].pixelId && Boolean(slot.active) === Boolean(right[index].active)
  );
}

function pagesFormEqual(a, b) {
  return PIXEL_LANDING_PAGE_KEYS.every((pageKey) =>
    PIXEL_PROVIDER_KEYS.every((providerKey) =>
      slotsEqual(a[pageKey]?.[providerKey] ?? [], b[pageKey]?.[providerKey] ?? [])
    )
  );
}

function pageActiveCount(providersForm) {
  return PIXEL_PROVIDER_KEYS.reduce(
    (total, providerKey) =>
      total + (providersForm[providerKey] ?? []).filter((slot) => slot.active && slot.pixelId).length,
    0
  );
}

export function PixelConfigSection({
  onUnauthorized,
  confirmDeactivate = window.confirm.bind(window),
  embedded = false,
}) {
  const [savedPages, setSavedPages] = useState(() => emptyPagesPixelForm());
  const [formPages, setFormPages] = useState(() => emptyPagesPixelForm());
  const [selectedPageKey, setSelectedPageKey] = useState("home");
  const [selectedProviderKey, setSelectedProviderKey] = useState("meta");
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
        const next = adminDataToForm(result.data);
        setSavedPages(next);
        setFormPages(next);
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

  const dirty = useMemo(() => !pagesFormEqual(formPages, savedPages), [formPages, savedPages]);
  const valid = useMemo(
    () =>
      PIXEL_LANDING_PAGE_KEYS.every((pageKey) =>
        PIXEL_PROVIDER_KEYS.every((providerKey) => canSavePixelSlots(formPages[pageKey]?.[providerKey]))
      ),
    [formPages]
  );
  const selectedPage = PIXEL_LANDING_PAGES.find((page) => page.key === selectedPageKey) ?? PIXEL_LANDING_PAGES[0];
  const selectedProvider =
    PIXEL_PROVIDERS.find((provider) => provider.key === selectedProviderKey) ?? PIXEL_PROVIDERS[0];
  const selectedSlots = formPages[selectedPageKey]?.[selectedProviderKey] ?? emptyPagesPixelForm().home.meta;
  const selectedSavedPage = savedPages[selectedPageKey] ?? emptyPagesPixelForm().home;
  const selectedSavedSlots = selectedSavedPage[selectedProviderKey] ?? emptyPagesPixelForm().home.meta;
  const selectedActiveCount = selectedSavedSlots.filter((slot) => slot.active && slot.pixelId).length;
  const canSubmit = dirty && valid && !saving && !loading;

  const restore = () => {
    setFormPages(savedPages);
    setSuccess("");
    setError("");
  };

  const submit = async () => {
    if (!canSubmit) return;

    const hadActiveOnProvider = selectedSavedSlots.some((slot) => slot.active && slot.pixelId);
    const hasActiveOnProvider = selectedSlots.some((slot) => slot.active && slot.pixelId);
    if (hadActiveOnProvider && !hasActiveOnProvider) {
      const confirmed = confirmDeactivate(
        `Desativar todos os pixels ${selectedProvider.label} em ${selectedPage.path}?`
      );
      if (!confirmed) return;
    }

    setSaving(true);
    setSuccess("");
    setError("");

    try {
      const result = await saveAdminPixelPages(formPages);
      if (result.unauthorized) {
        onUnauthorized();
        return;
      }
      const next = adminDataToForm(result.data);
      setSavedPages(next);
      setFormPages(next);
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
        marginTop: embedded ? 0 : 28,
      }}
    >
      {!embedded && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: "0.75rem", color: "#4a6a7a", letterSpacing: "0.05em", marginBottom: 6 }}>
            CONFIGURAÇÃO DO PIXEL POR PÁGINA
          </div>
          <div style={{ fontSize: "0.72rem", color: "#7a9bbf", lineHeight: 1.45 }}>
            Até 5 IDs por rota para Meta e para ChatGPT/OpenAI. Ex.: OpenAI usa só o pixelId (MCJXHhHwXwLQLYxMWbCEAs), não o script inteiro.
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {PIXEL_LANDING_PAGES.map((page) => {
          const activeOnPage = pageActiveCount(savedPages[page.key] ?? emptyPagesPixelForm().home) > 0;
          const selected = page.key === selectedPageKey;
          return (
            <button
              key={page.key}
              type="button"
              onClick={() => setSelectedPageKey(page.key)}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                border: selected ? "1px solid rgba(0,212,255,0.5)" : "1px solid rgba(255,255,255,0.1)",
                background: selected ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.04)",
                color: selected ? "#00d4ff" : "#7a9bbf",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {page.path}
              {activeOnPage ? " •" : ""}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {PIXEL_PROVIDERS.map((provider) => {
          const activeOnProvider = (savedPages[selectedPageKey]?.[provider.key] ?? []).some(
            (slot) => slot.active && slot.pixelId
          );
          const selected = provider.key === selectedProviderKey;
          const accent =
            provider.key === "openai"
              ? { border: "rgba(16,185,129,0.5)", bg: "rgba(16,185,129,0.12)", color: "#34d399" }
              : { border: "rgba(168,85,247,0.5)", bg: "rgba(168,85,247,0.12)", color: "#c4b5fd" };
          return (
            <button
              key={provider.key}
              type="button"
              onClick={() => setSelectedProviderKey(provider.key)}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                border: selected ? `1px solid ${accent.border}` : "1px solid rgba(255,255,255,0.1)",
                background: selected ? accent.bg : "rgba(255,255,255,0.04)",
                color: selected ? accent.color : "#7a9bbf",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {provider.label}
              {activeOnProvider ? " •" : ""}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ color: "#4a6a7a", fontSize: "0.8rem", textAlign: "center", padding: 20 }}>
          Carregando configuração...
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ fontSize: "0.8rem", color: "#d4eaf7", fontWeight: 700 }}>
              {selectedPage.label} · {selectedProvider.label}
            </div>
            <div
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                padding: "4px 10px",
                borderRadius: 20,
                color: selectedActiveCount > 0 ? "#00d4ff" : "#7a9bbf",
                background: selectedActiveCount > 0 ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.04)",
                border:
                  selectedActiveCount > 0 ? "1px solid rgba(0,212,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {selectedActiveCount > 0 ? `${selectedActiveCount} ATIVO(S)` : "NENHUM ATIVO"}
            </div>
          </div>

          <PixelPageSlotsEditor
            slots={selectedSlots}
            providerKey={selectedProviderKey}
            disabled={saving}
            onChange={(nextSlots) => {
              setFormPages((prev) => ({
                ...prev,
                [selectedPageKey]: {
                  ...prev[selectedPageKey],
                  [selectedProviderKey]: nextSlots,
                },
              }));
              setSuccess("");
              setError("");
            }}
          />

          {success && (
            <div style={{ color: "#34d399", fontSize: "0.75rem", marginTop: 16 }}>{success}</div>
          )}
          {error && (
            <div style={{ color: "#ff3e6c", fontSize: "0.75rem", marginTop: 16 }}>{error}</div>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
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
