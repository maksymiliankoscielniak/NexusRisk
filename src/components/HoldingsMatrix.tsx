import { AllocationDonut } from "./AllocationDonut";
import { SectionLabel } from "./SectionLabel";
import { GlowCard } from "./GlowCard";
import { formatCurrency, formatPct } from "../engine/math";
import { PORTFOLIO_VALUE } from "../data/universe";
import { usePortfolio } from "../state/PortfolioContext";

function ResetIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M10.5 6A4.5 4.5 0 1 1 6 1.5a4.48 4.48 0 0 1 3.18 1.32L8 4h3V1L9.88 2.12A5.5 5.5 0 1 0 11.5 6h-1Z" fill="currentColor"/>
    </svg>
  );
}

export function HoldingsMatrix() {
  const { holdings, updateWeight, resetAllocations } = usePortfolio();

  return (
    <section aria-labelledby="holdings-heading">
      <SectionLabel
        num="02"
        title="Holdings & Allocation Matrix"
        description="Adjust sleeve weights to rebalance in real time. Risk metrics, stress paths, and the AI memo recompute instantly."
      />

      <GlowCard padding="22px 24px 26px">
        <div className="section-header">
          <div>
            <h2 id="holdings-heading" className="section-heading">Allocation breakdown</h2>
          </div>
          <button type="button" className="btn btn-ghost" onClick={resetAllocations} id="reset-mix-btn">
            <ResetIcon />
            Reset mix
          </button>
        </div>

        <div className="holdings-layout">
          <AllocationDonut holdings={holdings} />

          <div className="holdings-table-wrap">
            <table className="holdings-table">
              <thead>
                <tr>
                  <th>Sleeve</th>
                  <th>Weight</th>
                  <th>Value</th>
                  <th>E[r]</th>
                  <th>Vol</th>
                  <th>Allocate</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.id}>
                    <td>
                      <div className="asset-cell">
                        <span className="asset-swatch" style={{ background: h.color }} aria-hidden="true" />
                        <div>
                          <div className="asset-name-text">{h.name}</div>
                          <div className="sleeve-badge">{h.sleeve}</div>
                        </div>
                      </div>
                    </td>
                    <td className="mono" style={{ color: "var(--text)" }}>{formatPct(h.weight, 1)}</td>
                    <td className="mono" style={{ color: "var(--text-2)" }}>{formatCurrency(PORTFOLIO_VALUE * h.weight)}</td>
                    <td className="mono" style={{ color: h.expectedReturn >= 0.06 ? "var(--safe)" : "var(--text-2)" }}>
                      {formatPct(h.expectedReturn)}
                    </td>
                    <td className="mono" style={{ color: h.volatility >= 0.15 ? "var(--warn)" : "var(--text-2)" }}>
                      {formatPct(h.volatility)}
                    </td>
                    <td>
                      <div className="slider-cell">
                        <div className="slider-label-row">
                          <span style={{ color: h.color }}>{formatPct(h.weight, 1)}</span>
                          <span style={{ color: "var(--text-3)" }}>max 80%</span>
                        </div>
                        <input
                          type="range"
                          min={0} max={80} step={1}
                          aria-label={`${h.name} weight`}
                          value={Math.round(h.weight * 100)}
                          style={{ accentColor: h.color }}
                          onChange={(e) => updateWeight(h.id, Number(e.target.value) / 100)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </GlowCard>
    </section>
  );
}
