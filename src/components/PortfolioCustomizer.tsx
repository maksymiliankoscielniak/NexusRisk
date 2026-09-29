/**
 * PortfolioCustomizer — slide-in drawer with:
 *  1. Inline % + $ numeric inputs alongside sliders
 *  2. "Normalize to 100%" button when total ≠ 100%
 *  3. Auto-balance Cash & T-Bills toggle
 *  4. Quick template chips inside the modal
 */
import { useEffect, useState } from "react";
import { ASSETS } from "../data/universe";
import { formatCurrency } from "../engine/math";
import { usePortfolio } from "../state/PortfolioContext";
import type { AssetId } from "../types";

/* ── Quick template chips ───────────────────────────────────── */
const CHIPS: { id: string; label: string; emoji: string; weights: Record<AssetId, number> }[] = [
  {
    id: "passive", label: "80/20 Passive", emoji: "🛡",
    weights: { globalEquities: 0.80, govBonds: 0.20, techGrowth: 0, gold: 0, cash: 0 },
  },
  {
    id: "growth", label: "Aggressive Growth", emoji: "🚀",
    weights: { techGrowth: 0.60, globalEquities: 0.30, gold: 0.05, cash: 0.05, govBonds: 0 },
  },
  {
    id: "weather", label: "Defensive All-Weather", emoji: "⛅",
    weights: { globalEquities: 0.30, govBonds: 0.40, techGrowth: 0.15, gold: 0.075, cash: 0.075 },
  },
  {
    id: "equal", label: "Equal Weight", emoji: "⚖",
    weights: { globalEquities: 0.20, techGrowth: 0.20, govBonds: 0.20, gold: 0.20, cash: 0.20 },
  },
];

const QUICK_VALUES = [10_000, 50_000, 100_000, 500_000, 1_000_000, 12_400_000];

/* ── State helpers ──────────────────────────────────────────── */
type StrMap = Record<AssetId, string>;

function toPctStr(w: number)  { return (w * 100).toFixed(1); }
function toUsdStr(w: number, val: number) { return Math.round(w * val).toLocaleString(); }

function buildStrMaps(weights: Record<AssetId, number>, val: number): { pct: StrMap; usd: StrMap } {
  const pct = {} as StrMap;
  const usd = {} as StrMap;
  for (const a of ASSETS) {
    pct[a.id] = toPctStr(weights[a.id]);
    usd[a.id] = toUsdStr(weights[a.id], val);
  }
  return { pct, usd };
}

function parseRaw(s: string): number {
  return parseFloat(s.replace(/[$,%\s,]/g, ""));
}

/* ── Component ──────────────────────────────────────────────── */
export function PortfolioCustomizer() {
  const { customizerOpen, setCustomizerOpen, portfolioValue, holdings, applyCustomPortfolio } = usePortfolio();

  /* Draft state */
  const [draftValue,   setDraftValue]   = useState(portfolioValue);
  const [valueInput,   setValueInput]   = useState(portfolioValue.toLocaleString());
  const [draftWeights, setDraftWeights] = useState<Record<AssetId, number>>(
    () => Object.fromEntries(holdings.map(h => [h.id, h.weight])) as Record<AssetId, number>,
  );
  const [pctStr, setPctStr] = useState<StrMap>({} as StrMap);
  const [usdStr, setUsdStr] = useState<StrMap>({} as StrMap);
  const [autoBalance, setAutoBalance] = useState(false);
  const [activeChip,  setActiveChip]  = useState<string | null>(null);

  /* Sync from context whenever drawer opens */
  useEffect(() => {
    if (!customizerOpen) return;
    const w = Object.fromEntries(holdings.map(h => [h.id, h.weight])) as Record<AssetId, number>;
    setDraftValue(portfolioValue);
    setValueInput(portfolioValue.toLocaleString());
    setDraftWeights(w);
    const { pct, usd } = buildStrMaps(w, portfolioValue);
    setPctStr(pct);
    setUsdStr(usd);
    setAutoBalance(false);
    setActiveChip(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customizerOpen]);

  /* ── Core weight updater ──────────────────────────────────── */
  function commit(next: Record<AssetId, number>, newVal = draftValue, chip: string | null = null) {
    setDraftWeights(next);
    const { pct, usd } = buildStrMaps(next, newVal);
    setPctStr(pct);
    setUsdStr(usd);
    setActiveChip(chip);
  }

  function applyWeight(id: AssetId, raw: number) {
    const clamped = Math.max(0, Math.min(1, raw));
    let next = { ...draftWeights, [id]: clamped };

    if (autoBalance && id !== "cash") {
      const nonCashSum = ASSETS
        .filter(a => a.id !== "cash")
        .reduce((s, a) => s + next[a.id], 0);
      next = { ...next, cash: Math.max(0, 1 - nonCashSum) };
    }
    commit(next, draftValue, null);
  }

  function normalize() {
    const total = Object.values(draftWeights).reduce((s, w) => s + w, 0);
    if (total < 1e-9) return;
    const next = Object.fromEntries(
      ASSETS.map(a => [a.id, draftWeights[a.id] / total]),
    ) as Record<AssetId, number>;
    commit(next, draftValue, null);
  }

  /* ── Value input ──────────────────────────────────────────── */
  function applyValue(v: number) {
    setDraftValue(v);
    setValueInput(v.toLocaleString());
    // Rebuild only dollar strings (weights unchanged)
    const usd = {} as StrMap;
    for (const a of ASSETS) usd[a.id] = toUsdStr(draftWeights[a.id], v);
    setUsdStr(usd);
  }

  function onValueBlur() {
    const v = parseRaw(valueInput);
    if (v > 0) applyValue(v);
    else setValueInput(draftValue.toLocaleString());
  }

  /* ── % input handlers ─────────────────────────────────────── */
  function onPctBlur(id: AssetId) {
    const v = parseRaw(pctStr[id]);
    if (!isNaN(v)) applyWeight(id, v / 100);
    else setPctStr(p => ({ ...p, [id]: toPctStr(draftWeights[id]) }));
  }

  /* ── $ input handlers ─────────────────────────────────────── */
  function onUsdBlur(id: AssetId) {
    const v = parseRaw(usdStr[id]);
    if (!isNaN(v) && draftValue > 0) applyWeight(id, v / draftValue);
    else setUsdStr(u => ({ ...u, [id]: toUsdStr(draftWeights[id], draftValue) }));
  }

  /* ── Derived ──────────────────────────────────────────────── */
  const totalWeight = Object.values(draftWeights).reduce((s, w) => s + w, 0);
  const weightOk    = Math.abs(totalWeight - 1) < 0.001;
  const weightOver  = totalWeight > 1.001;

  if (!customizerOpen) return null;

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Customize Portfolio"
      onClick={e => { if (e.target === e.currentTarget) setCustomizerOpen(false); }}
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
        display: "flex", justifyContent: "flex-end",
      }}
    >
      <div style={{
        width: "min(560px, 100vw)", height: "100vh",
        background: "rgba(3,8,26,0.97)",
        borderLeft: "1px solid rgba(0,213,255,0.15)",
        boxShadow: "-32px 0 96px rgba(0,0,0,0.85)",
        display: "flex", flexDirection: "column",
        backdropFilter: "blur(40px)",
        animation: "slideInRight 0.3s cubic-bezier(0.22,1,0.36,1) forwards",
      }}>

        {/* ── HEADER ──────────────────────────────────────────── */}
        <div style={{ padding: "22px 26px 16px", borderBottom: "1px solid rgba(0,213,255,0.08)", flexShrink: 0 }}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 700, letterSpacing: "-0.025em", background: "linear-gradient(135deg, var(--cyan-lt), var(--pink))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Customize Portfolio
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-3)", marginTop: 2 }}>
                Changes saved to browser · persist across reloads
              </div>
            </div>
            <button
              onClick={() => setCustomizerOpen(false)}
              aria-label="Close"
              style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-2)", cursor: "none", flexShrink: 0 }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M10 2L2 10M2 2l8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Auto-balance toggle */}
          <div
            onClick={() => setAutoBalance(v => !v)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 13px", borderRadius: 10, background: autoBalance ? "rgba(0,213,255,0.06)" : "rgba(255,255,255,0.025)", border: `1px solid ${autoBalance ? "rgba(0,213,255,0.22)" : "rgba(255,255,255,0.07)"}`, cursor: "none", transition: "all 0.22s", userSelect: "none" }}
            role="switch"
            aria-checked={autoBalance}
          >
            <div>
              <div style={{ fontSize: "0.79rem", fontWeight: 600, color: autoBalance ? "var(--cyan-lt)" : "var(--text)" }}>
                Auto-balance with Cash & T-Bills
              </div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-3)", marginTop: 1 }}>
                Adjusting any asset automatically absorbs the difference into Cash
              </div>
            </div>
            {/* iOS-style toggle */}
            <div style={{ width: 40, height: 22, borderRadius: 11, background: autoBalance ? "var(--cyan)" : "rgba(255,255,255,0.14)", position: "relative", flexShrink: 0, marginLeft: 14, transition: "background 0.22s", boxShadow: autoBalance ? "0 0 14px rgba(0,213,255,0.5)" : "none" }}>
              <div style={{ position: "absolute", top: 3, left: autoBalance ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "white", transition: "left 0.22s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }} />
            </div>
          </div>
        </div>

        {/* ── BODY ────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 26px", display: "flex", flexDirection: "column", gap: 22 }}>

          {/* Quick template chips */}
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--text-3)", marginBottom: 8 }}>Quick Templates</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
              {CHIPS.map(chip => {
                const active = activeChip === chip.id;
                return (
                  <button
                    key={chip.id}
                    onClick={() => commit(chip.weights as Record<AssetId, number>, draftValue, chip.id)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 99, fontSize: "0.72rem", fontWeight: 600, background: active ? "var(--cyan-dim)" : "rgba(255,255,255,0.04)", border: `1px solid ${active ? "rgba(0,213,255,0.35)" : "rgba(255,255,255,0.08)"}`, color: active ? "var(--cyan-lt)" : "var(--text-2)", cursor: "none", transition: "all 0.18s", whiteSpace: "nowrap" as const, boxShadow: active ? "0 0 12px rgba(0,213,255,0.15)" : "none" }}
                  >
                    <span style={{ fontSize: "0.8rem" }}>{chip.emoji}</span>
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Portfolio Value */}
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--text-3)", marginBottom: 8 }}>Total Portfolio Value</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ color: "var(--text-2)", fontSize: "1rem", fontWeight: 600 }}>$</span>
              <input
                value={valueInput}
                onChange={e => setValueInput(e.target.value)}
                onBlur={onValueBlur}
                onKeyDown={e => e.key === "Enter" && onValueBlur()}
                placeholder="e.g. 100,000"
                style={{ flex: 1, padding: "9px 12px", background: "rgba(0,213,255,0.04)", border: "1px solid rgba(0,213,255,0.2)", borderRadius: 9, color: "var(--text)", fontSize: "1rem", fontFamily: "var(--mono)", fontWeight: 600, outline: "none" }}
                aria-label="Portfolio total value"
              />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5 }}>
              {QUICK_VALUES.map(v => {
                const active = draftValue === v;
                return (
                  <button
                    key={v}
                    onClick={() => applyValue(v)}
                    style={{ padding: "5px 10px", borderRadius: 8, fontSize: "0.7rem", fontWeight: 600, background: active ? "var(--cyan-dim)" : "rgba(255,255,255,0.03)", border: `1px solid ${active ? "rgba(0,213,255,0.32)" : "rgba(255,255,255,0.07)"}`, color: active ? "var(--cyan)" : "var(--text-3)", cursor: "none", whiteSpace: "nowrap" as const, transition: "all 0.15s" }}
                  >
                    {formatCurrency(v)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Asset allocation rows */}
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--text-3)", marginBottom: 10 }}>Asset Allocation</div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 7 }}>
              {ASSETS.map(asset => {
                const w  = draftWeights[asset.id] ?? 0;
                const pc = pctStr[asset.id] ?? toPctStr(w);
                const us = usdStr[asset.id] ?? toUsdStr(w, draftValue);

                return (
                  <div
                    key={asset.id}
                    style={{ padding: "11px 13px 10px", borderRadius: 12, background: "rgba(255,255,255,0.025)", border: `1px solid ${w > 0 ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)"}`, opacity: w === 0 && !autoBalance ? 0.55 : 1, transition: "opacity 0.2s" }}
                  >
                    {/* Row 1 — name + inputs */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: asset.color, flexShrink: 0, boxShadow: w > 0 ? `0 0 7px ${asset.color}99` : "none", transition: "box-shadow 0.2s" }} />
                      <span style={{ fontSize: "0.82rem", fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                        {asset.name}
                      </span>
                      <span style={{ fontSize: "0.62rem", color: "var(--text-3)", flexShrink: 0 }}>{asset.sleeve}</span>

                      {/* % input pill */}
                      <div style={{ display: "flex", alignItems: "center", background: "rgba(0,0,0,0.3)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 7, padding: "3px 6px 3px 8px", flexShrink: 0 }}>
                        <input
                          value={pc}
                          onChange={e => setPctStr(p => ({ ...p, [asset.id]: e.target.value }))}
                          onBlur={() => onPctBlur(asset.id)}
                          onKeyDown={e => e.key === "Enter" && onPctBlur(asset.id)}
                          style={{ width: 40, background: "transparent", border: "none", outline: "none", color: asset.color, fontFamily: "var(--mono)", fontSize: "0.82rem", fontWeight: 700, textAlign: "right" as const }}
                          aria-label={`${asset.name} percentage`}
                        />
                        <span style={{ fontSize: "0.7rem", color: "var(--text-3)", userSelect: "none" as const, marginLeft: 1 }}>%</span>
                      </div>

                      {/* $ input pill */}
                      <div style={{ display: "flex", alignItems: "center", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: "3px 8px 3px 6px", flexShrink: 0 }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-3)", userSelect: "none" as const, marginRight: 2 }}>$</span>
                        <input
                          value={us}
                          onChange={e => setUsdStr(u => ({ ...u, [asset.id]: e.target.value }))}
                          onBlur={() => onUsdBlur(asset.id)}
                          onKeyDown={e => e.key === "Enter" && onUsdBlur(asset.id)}
                          style={{ width: 70, background: "transparent", border: "none", outline: "none", color: "var(--text-2)", fontFamily: "var(--mono)", fontSize: "0.78rem", fontWeight: 600 }}
                          aria-label={`${asset.name} dollar amount`}
                        />
                      </div>
                    </div>

                    {/* Row 2 — slider */}
                    <input
                      type="range"
                      min={0} max={100} step={0.5}
                      value={w * 100}
                      onChange={e => applyWeight(asset.id, parseFloat(e.target.value) / 100)}
                      style={{ width: "100%", accentColor: asset.color, cursor: "none" }}
                      aria-label={`${asset.name} allocation slider`}
                    />

                    {/* Row 3 — coloured fill bar */}
                    <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.05)", marginTop: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, w * 100)}%`, background: asset.color, borderRadius: 99, transition: "width 0.12s ease-out", boxShadow: `0 0 8px ${asset.color}60` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── FOOTER ──────────────────────────────────────────── */}
        <div style={{ padding: "14px 26px 22px", borderTop: "1px solid rgba(0,213,255,0.08)", flexShrink: 0 }}>

          {/* Total weight status bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 13px", borderRadius: 10, marginBottom: 12, transition: "all 0.22s", background: weightOk ? "rgba(0,255,157,0.06)" : weightOver ? "rgba(255,51,85,0.07)" : "rgba(255,200,0,0.06)", border: `1px solid ${weightOk ? "rgba(0,255,157,0.22)" : weightOver ? "rgba(255,51,85,0.28)" : "rgba(255,200,0,0.24)"}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: weightOk ? "var(--safe)" : weightOver ? "var(--danger)" : "var(--warn)" }}>
                {weightOk ? "✓ Total allocation" : "Total allocation"}
              </span>
              {!weightOk && (
                <span style={{ fontSize: "0.66rem", color: weightOver ? "var(--danger)" : "var(--warn)" }}>
                  {weightOver ? "— over 100%" : "— under 100%"}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: "0.88rem", fontWeight: 700, color: weightOk ? "var(--safe)" : weightOver ? "var(--danger)" : "var(--warn)" }}>
                {(totalWeight * 100).toFixed(1)}%
              </span>
              {/* Normalize button — only visible when not 100% */}
              {!weightOk && (
                <button
                  onClick={normalize}
                  style={{ padding: "4px 11px", borderRadius: 7, fontSize: "0.7rem", fontWeight: 700, background: "rgba(0,213,255,0.14)", border: "1px solid rgba(0,213,255,0.36)", color: "var(--cyan)", cursor: "none", whiteSpace: "nowrap" as const, boxShadow: "0 0 10px rgba(0,213,255,0.2)", animation: "blink 1.8s ease-in-out infinite" }}
                >
                  ↺ Normalize to 100%
                </button>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setCustomizerOpen(false)}
              style={{ padding: "11px 20px", background: "rgba(255,255,255,0.03)", color: "var(--text-2)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, fontSize: "0.84rem", fontWeight: 600, cursor: "none" }}
            >
              Cancel
            </button>
            <button
              onClick={() => { if (weightOk) { applyCustomPortfolio(draftValue, draftWeights); setCustomizerOpen(false); } }}
              disabled={!weightOk}
              style={{ flex: 1, padding: "11px 0", background: weightOk ? "var(--cyan)" : "rgba(0,213,255,0.12)", color: weightOk ? "#01101a" : "var(--text-3)", border: "none", borderRadius: 10, fontSize: "0.85rem", fontWeight: 700, cursor: weightOk ? "none" : "not-allowed", boxShadow: weightOk ? "0 0 24px rgba(0,213,255,0.3)" : "none", transition: "all 0.2s" }}
            >
              Apply Portfolio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
