import { formatCurrency } from "../engine/math";

interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipEntry[];
}

const STRESS_KEYS = [
  { key: "baseline", name: "Baseline",   color: "#94a3b8" },
  { key: "stressed", name: "Stressed",   color: "#fb4f67" },
] as const;

const BAND_KEYS = [
  { key: "p5",  name: "5th pct",  color: "#818cf8" },
  { key: "p50", name: "Median",   color: "#00d4aa" },
  { key: "p95", name: "95th pct", color: "#f59e0b" },
] as const;

export function ChartTooltip({ active, label, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload as Record<string, unknown> | undefined;
  const isBands = row && typeof row.p50 === "number";
  const isStress =
    row && typeof row.baseline === "number" && typeof row.stressed === "number";

  if (isBands && row) {
    return (
      <div className="chart-tooltip">
        <div className="chart-tooltip-label">{label}</div>
        {BAND_KEYS.map((item) => (
          <div key={item.key} className="chart-tooltip-row">
            <span className="chart-tooltip-name">
              <span className="chart-tooltip-dot" style={{ background: item.color }} />
              {item.name}
            </span>
            <span className="chart-tooltip-val" style={{ color: item.color }}>
              {formatCurrency(Number(row[item.key]))}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (isStress && row) {
    return (
      <div className="chart-tooltip">
        <div className="chart-tooltip-label">{label}</div>
        {STRESS_KEYS.map((item) => (
          <div key={item.key} className="chart-tooltip-row">
            <span className="chart-tooltip-name">
              <span className="chart-tooltip-dot" style={{ background: item.color }} />
              {item.name}
            </span>
            <span className="chart-tooltip-val" style={{ color: item.color }}>
              {formatCurrency(Number(row[item.key]))}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map((entry) => (
        <div key={String(entry.name ?? entry.dataKey)} className="chart-tooltip-row">
          <span className="chart-tooltip-name">
            <span className="chart-tooltip-dot" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="chart-tooltip-val" style={{ color: entry.color }}>
            {formatCurrency(Number(entry.value))}
          </span>
        </div>
      ))}
    </div>
  );
}
