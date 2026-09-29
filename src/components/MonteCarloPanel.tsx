import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MONTE_CARLO_PATHS } from "../data/universe";
import { formatCurrency, formatPct } from "../engine/math";
import { usePortfolio } from "../state/PortfolioContext";
import { SectionLabel } from "./SectionLabel";
import { GlowCard } from "./GlowCard";
import { ChartTooltip } from "./ChartTooltip";

function ResampleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M11 6.5A4.5 4.5 0 1 1 6.5 2a4.48 4.48 0 0 1 3.18 1.32L8.5 4.5H11V2L9.88 3.12A5.5 5.5 0 1 0 12 6.5h-1Z" fill="currentColor"/>
    </svg>
  );
}

export function MonteCarloPanel() {
  const { monteCarlo, rerunMonteCarlo, timeRange, metrics } = usePortfolio();

  const data = monteCarlo.bands.map((p) => ({
    ...p,
    band: Math.max(p.p95 - p.p5, 0),
  }));

  const last      = monteCarlo.bands[monteCarlo.bands.length - 1];
  const first     = monteCarlo.bands[0];
  const p50End    = last?.p50  ?? 0;
  const p5End     = last?.p5   ?? 0;
  const p95End    = last?.p95  ?? 0;
  const startVal  = first?.p50 ?? 1;
  const medReturn = (p50End - startVal) / startVal;

  return (
    <section aria-labelledby="mc-heading">
      <SectionLabel
        num="04"
        title="Stochastic Simulation Engine"
        description={`${MONTE_CARLO_PATHS} Monte Carlo paths · ${timeRange} horizon · E[r] ${formatPct(metrics.expectedYield)} · σ ${formatPct(metrics.volatility)}`}
      />

      <GlowCard padding="22px 24px 26px" disableTilt>
        <div className="section-header">
          <h2 id="mc-heading" className="section-heading">Monte Carlo projection</h2>
          <button type="button" className="btn btn-ghost" onClick={rerunMonteCarlo} id="resample-btn">
            <ResampleIcon />
            Resample paths
          </button>
        </div>

        {/* Stats bar */}
        <div className="mc-stats-bar">
          <div className="mc-stat">
            <div className="mc-stat-label">Median end value</div>
            <div className={`mc-stat-val ${medReturn >= 0 ? "pos" : "neg"}`}>{formatCurrency(p50End)}</div>
          </div>
          <div className="mc-stat">
            <div className="mc-stat-label">Median return</div>
            <div className={`mc-stat-val ${medReturn >= 0 ? "pos" : "neg"}`}>
              {medReturn >= 0 ? "+" : ""}{formatPct(medReturn)}
            </div>
          </div>
          <div className="mc-stat">
            <div className="mc-stat-label">95th pct</div>
            <div className="mc-stat-val pos">{formatCurrency(p95End)}</div>
          </div>
          <div className="mc-stat">
            <div className="mc-stat-label">5th pct</div>
            <div className="mc-stat-val neg">{formatCurrency(p5End)}</div>
          </div>
          <div className="mc-stat">
            <div className="mc-stat-label">Outcome spread</div>
            <div className="mc-stat-val neutral">{formatCurrency(p95End - p5End)}</div>
          </div>
        </div>

        {/* Chart */}
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 6, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v: number) => formatCurrency(v)}
                tick={{ fill: "#475569", fontSize: 11 }}
                axisLine={false} tickLine={false} width={78}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="p5"   stackId="band" stroke="none" fill="transparent" isAnimationActive={false} legendType="none" />
              <Area type="monotone" dataKey="band" stackId="band" stroke="none" fill="rgba(0,213,255,0.07)" isAnimationActive={false} legendType="none" />
              <Line type="monotone" dataKey="p5"  name="5th percentile"  stroke="#ff2d78" strokeWidth={1.5} strokeDasharray="5 3" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="p50" name="Median"          stroke="#00d5ff" strokeWidth={2.4} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="p95" name="95th percentile" stroke="#ffe000" strokeWidth={1.5} strokeDasharray="5 3" dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mc-legend">
          <div className="mc-legend-item">
            <span className="mc-legend-line" style={{ background: "#ffe000" }} />
            95th percentile
          </div>
          <div className="mc-legend-item">
            <span className="mc-legend-line" style={{ background: "#00d5ff" }} />
            Median (50th)
          </div>
          <div className="mc-legend-item">
            <span className="mc-legend-line" style={{ background: "#ff2d78" }} />
            5th percentile
          </div>
          <div className="mc-legend-item">
            <span style={{ display:"inline-block", width:20, height:12, background:"rgba(0,213,255,0.08)", border:"1px solid rgba(0,213,255,0.25)", borderRadius:3 }} />
            Confidence band
          </div>
        </div>
      </GlowCard>
    </section>
  );
}
