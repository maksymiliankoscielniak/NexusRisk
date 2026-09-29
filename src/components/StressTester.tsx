import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatMonths, formatPct } from "../engine/math";
import { usePortfolio } from "../state/PortfolioContext";
import { SectionLabel } from "./SectionLabel";
import { GlowCard } from "./GlowCard";
import { ChartTooltip } from "./ChartTooltip";
import type { CrisisImpact } from "../types";

const SCENARIO_ICONS: Record<string, string> = {
  gfc2008:        "💀",
  covid2020:      "🦠",
  stagflation:    "📈",
  techCorrection: "💻",
};

function sev(dd: number, hi: number, mid: number): "danger" | "warn" | "safe" {
  return dd > hi ? "danger" : dd > mid ? "warn" : "safe";
}

function liqSev(r: CrisisImpact["liquidityRisk"]): "danger" | "warn" | "safe" {
  return r === "Severe" || r === "Elevated" ? "danger" : r === "Moderate" ? "warn" : "safe";
}

export function StressTester() {
  const { scenarios, scenario, setScenarioId, stressPath, impact, highlightStress } = usePortfolio();

  return (
    <section id="stress-module" aria-labelledby="stress-heading" className={highlightStress ? "section-pulse" : ""}>
      <SectionLabel
        num="03"
        title="Black Swan Crisis Stress-Tester"
        description={scenario.summary}
      />

      <GlowCard padding="22px 24px 26px" disableTilt>
        <h2 id="stress-heading" className="section-heading" style={{ marginBottom: 18 }}>
          Scenario selector
        </h2>

        {/* Scenarios */}
        <div className="scenario-grid">
          {scenarios.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`scenario-btn${item.id === scenario.id ? " scenario-btn--active" : ""}`}
              onClick={() => setScenarioId(item.id)}
              id={`scenario-btn-${item.id}`}
            >
              <span className="scenario-icon" aria-hidden="true">{SCENARIO_ICONS[item.id] ?? "⚡"}</span>
              <span className="scenario-name">{item.name}</span>
              <span className="scenario-era">{item.era}</span>
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stressPath} margin={{ top: 6, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v: number) => formatCurrency(v)}
                tick={{ fill: "#475569", fontSize: 11 }}
                axisLine={false} tickLine={false} width={78}
              />
              <Tooltip content={<ChartTooltip />} />
              {impact.troughMonth > 0 && (
                <ReferenceLine
                  x={`M${impact.troughMonth}`}
                  stroke="rgba(251,113,133,0.35)"
                  strokeDasharray="4 3"
                  label={{ value: "Trough", fill: "rgba(251,113,133,0.6)", fontSize: 10, position: "top" }}
                />
              )}
              <Line type="monotone" dataKey="baseline" name="Baseline"
                stroke="#3a5470" strokeWidth={1.8} dot={false} strokeDasharray="5 3" />
              <Line type="monotone" dataKey="stressed" name="Stressed"
                stroke="#ff2d78" strokeWidth={2.4} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Impact */}
        <div className="impact-grid">
          <div className={`impact-card ${sev(impact.maxDrawdown, 0.2, 0.1)}`}>
            <div className="impact-label">Max drawdown</div>
            <div className="impact-val">{formatPct(impact.maxDrawdown)}</div>
          </div>
          <div className={`impact-card ${sev(impact.capitalAtRisk, 2_000_000, 800_000)}`}>
            <div className="impact-label">Capital at risk</div>
            <div className="impact-val">{formatCurrency(impact.capitalAtRisk)}</div>
          </div>
          <div className={`impact-card ${sev(impact.recoveryMonths ?? 99, 18, 8)}`}>
            <div className="impact-label">Recovery time</div>
            <div className="impact-val">{formatMonths(impact.recoveryMonths)}</div>
          </div>
          <div className={`impact-card ${liqSev(impact.liquidityRisk)}`}>
            <div className="impact-label">Liquidity risk</div>
            <div className="impact-val">{impact.liquidityRisk}</div>
          </div>
        </div>
      </GlowCard>
    </section>
  );
}
