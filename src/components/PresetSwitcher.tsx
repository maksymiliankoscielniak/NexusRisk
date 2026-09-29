import { usePortfolio } from "../state/PortfolioContext";

export function PresetSwitcher() {
  const { presets, activePresetId, applyPreset, setCustomizerOpen } = usePortfolio();

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      flexWrap: "wrap" as const,
    }}>
      {/* Preset pills */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" as const }}>
        {presets.map((preset) => {
          const active = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              title={preset.description}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "5px 11px", borderRadius: 99,
                fontSize: "0.72rem", fontWeight: 600,
                background: active ? "var(--cyan-dim)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${active ? "rgba(0,213,255,0.35)" : "rgba(255,255,255,0.08)"}`,
                color: active ? "var(--cyan-lt)" : "var(--text-2)",
                cursor: "none",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap" as const,
                boxShadow: active ? "0 0 14px rgba(0,213,255,0.12)" : "none",
              }}
            >
              <span style={{ fontSize: "0.75rem" }}>{preset.emoji}</span>
              {preset.name}
              {active && (
                <span style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: "var(--cyan)", boxShadow: "0 0 6px var(--cyan)",
                  flexShrink: 0,
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

      {/* Edit custom button */}
      <button
        onClick={() => setCustomizerOpen(true)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 13px", borderRadius: 99,
          fontSize: "0.72rem", fontWeight: 700,
          background: activePresetId === null ? "rgba(0,213,255,0.10)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${activePresetId === null ? "rgba(0,213,255,0.32)" : "rgba(255,255,255,0.10)"}`,
          color: activePresetId === null ? "var(--cyan)" : "var(--text-2)",
          cursor: "none",
          transition: "all 0.2s ease",
          whiteSpace: "nowrap" as const,
        }}
        aria-label="Open portfolio customizer"
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
          <path d="M8.5 1.5l1 1-6 6H2.5v-1l6-6Z" fill="currentColor"/>
          <path d="M9.5 0.5a1 1 0 0 1 1 1l-1-1Z" fill="currentColor" opacity="0.4"/>
        </svg>
        {activePresetId === null ? "Custom ●" : "Edit Portfolio"}
      </button>
    </div>
  );
}
