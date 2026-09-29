import { usePortfolio } from "../state/PortfolioContext";
import type { DataStatus } from "../state/PortfolioContext";
import { formatCurrency, formatPct } from "../engine/math";
import { SectionLabel } from "./SectionLabel";
import { GlowCard } from "./GlowCard";
import { PresetSwitcher } from "./PresetSwitcher";
import type { TimeRange } from "../types";

const RANGES: TimeRange[] = ["1M", "3M", "6M", "1Y", "2Y"];

function CrisisIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M7.5 1L2 8H6L4.5 12 11.5 5H7.5L7.5 1Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

function StatusBadge({
  status,
  fetchedAt,
  error,
  nextRefreshIn,
  onRetry,
}: {
  status: DataStatus;
  fetchedAt: Date | null;
  error: string | null;
  nextRefreshIn: number;
  onRetry: () => void;
}) {
  if (status === "loading") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "4px 10px", borderRadius: 99, fontSize: "0.7rem", fontWeight: 600,
        background: "rgba(0,213,255,0.07)", border: "1px solid rgba(0,213,255,0.2)",
        color: "var(--text-3)", animation: "blink 1.4s steps(1) infinite",
      }}>
        ◌ Fetching live data…
      </span>
    );
  }
  if (status === "live") {
    const time = fetchedAt ? fetchedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "4px 12px", borderRadius: 99, fontSize: "0.7rem", fontWeight: 600,
        background: "var(--safe-dim)", border: "1px solid rgba(0,255,157,0.28)",
        color: "var(--safe)",
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
          background: "var(--safe)", boxShadow: "0 0 8px var(--safe)",
          animation: "blink 2s ease-in-out infinite",
        }} />
        LIVE · SPY / QQQ / TLT / GLD / BIL · {time}
        <span style={{ marginLeft: 2, color: "rgba(0,255,157,0.5)", fontFamily: "var(--mono)", fontSize: "0.65rem" }}>
          ↻ {nextRefreshIn}s
        </span>
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span
        title={error ?? "Network unavailable"}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "4px 10px", borderRadius: 99, fontSize: "0.7rem", fontWeight: 600,
          background: "var(--warn-dim)", border: "1px solid rgba(255,224,0,0.28)",
          color: "var(--warn)", cursor: "help",
        }}
      >
        ⚠ Simulated data
      </span>
      <button
        type="button"
        onClick={onRetry}
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "4px 10px", borderRadius: 99, fontSize: "0.7rem", fontWeight: 600,
          background: "var(--cyan-dim)", border: "1px solid rgba(0,213,255,0.28)",
          color: "var(--cyan)", cursor: "none",
        }}
      >
        ↺ Retry
      </button>
    </span>
  );
}

export function Overview() {
  const {
    metrics, timeRange, setTimeRange, runCrisisSimulation,
    dataStatus, dataFetchedAt, dataError, nextRefreshIn, retryMarketData,
  } = usePortfolio();

  const sharpeColor =
    metrics.sharpe >= 0.8 ? "var(--safe)" :
    metrics.sharpe >= 0.4 ? "var(--cyan)" :
    "var(--danger)";

  return (
    <section aria-labelledby="overview-heading">
      {/* Preset switcher row */}
      <div style={{ marginBottom: 14 }}>
        <PresetSwitcher />
      </div>

      <SectionLabel num="01" title="Portfolio Overview" />

      {/* Controls */}
      <div className="overview-controls">
        <div className="time-chips" role="tablist" aria-label="Time range">
          {RANGES.map((r) => (
            <button
              key={r}
              role="tab"
              type="button"
              className={`time-chip${timeRange === r ? " time-chip--active" : ""}`}
              aria-selected={timeRange === r}
              onClick={() => setTimeRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <StatusBadge
          status={dataStatus}
          fetchedAt={dataFetchedAt}
          error={dataError}
          nextRefreshIn={nextRefreshIn}
          onRetry={retryMarketData}
        />
        <button type="button" className="btn-crisis" onClick={runCrisisSimulation} id="crisis-sim-btn">
          <CrisisIcon />
          Run crisis simulation
        </button>
      </div>

      {/* Bento grid */}
      <div className="metrics-bento">

        {/* Hero: Portfolio Value */}
        <div className="metric-hero-wrapper">
          <GlowCard className="glow-card--hero" style={{ height: "100%" }}>
            <div className="metric-hero-content">
              <div className="metric-hero-top">
                <div className="metric-label">Portfolio Value</div>
                <div className="metric-hero-value">{formatCurrency(metrics.value)}</div>
                <div className="metric-hint">Institutional model book</div>
              </div>
              <div className="metric-hero-badge">
                {dataStatus === "live" ? "⬤ Live metrics" : dataStatus === "loading" ? "◌ Loading…" : "⚠ Simulated"}
              </div>
            </div>
            <div className="metric-hero-deco" aria-hidden="true" />
          </GlowCard>
        </div>

        {/* Expected Yield */}
        <div className="metric-card-wrap">
          <GlowCard style={{ height: "100%" }}>
            <div className="metric-label">Expected Yield</div>
            <div className="metric-value" style={{ color: "var(--safe)" }}>
              {formatPct(metrics.expectedYield)}
            </div>
            <div className="metric-hint">Annualized, weight-blended</div>
          </GlowCard>
        </div>

        {/* Volatility */}
        <div className="metric-card-wrap">
          <GlowCard style={{ height: "100%" }}>
            <div className="metric-label">Portfolio Volatility</div>
            <div className="metric-value" style={{ color: "var(--warn)" }}>
              {formatPct(metrics.volatility)}
            </div>
            <div className="metric-hint">σ with correlations</div>
          </GlowCard>
        </div>

        {/* Sharpe */}
        <div className="metric-card-wrap">
          <GlowCard style={{ height: "100%" }}>
            <div className="metric-label">Sharpe Ratio</div>
            <div className="metric-value" style={{ color: sharpeColor }}>
              {metrics.sharpe.toFixed(2)}
            </div>
            <div className="metric-hint">vs 4.2% risk-free rate</div>
          </GlowCard>
        </div>

        {/* VaR */}
        <div className="metric-card-wrap">
          <GlowCard style={{ height: "100%" }}>
            <div className="metric-label">VaR 95%</div>
            <div className="metric-value" style={{ color: "var(--danger)" }}>
              {formatCurrency(metrics.var95)}
            </div>
            <div className="metric-hint">1-year parametric loss</div>
          </GlowCard>
        </div>

      </div>
    </section>
  );
}
