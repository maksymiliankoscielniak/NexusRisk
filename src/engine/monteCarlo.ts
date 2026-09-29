import { MONTE_CARLO_PATHS, PORTFOLIO_VALUE } from "../data/universe";
import type { Holding, MonteCarloResult, PercentilePoint, TimeRange } from "../types";
import { computePortfolioMetrics, monthLabel, percentile } from "./math";

const RANGE_MONTHS: Record<TimeRange, number> = {
  "1M": 1,
  "3M": 3,
  "6M": 6,
  "1Y": 12,
  "2Y": 24,
};

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(random: () => number): number {
  const u = Math.max(random(), 1e-12);
  const v = Math.max(random(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function runMonteCarlo(
  holdings: Holding[],
  range: TimeRange,
  seed = 20240928,
): MonteCarloResult {
  const months = RANGE_MONTHS[range];
  const { expectedYield: mu, volatility: sigma } = computePortfolioMetrics(holdings, 1);
  const vol = Math.max(sigma, 1e-6);
  const dt = 1 / 12;
  const drift = (mu - 0.5 * vol * vol) * dt;
  const diffusion = vol * Math.sqrt(dt);
  const random = mulberry32(seed + Math.round(mu * 1e6) + Math.round(vol * 1e6));

  const paths: number[][] = [];
  for (let i = 0; i < MONTE_CARLO_PATHS; i += 1) {
    const path = [PORTFOLIO_VALUE];
    let value = PORTFOLIO_VALUE;
    for (let month = 1; month <= months; month += 1) {
      value *= Math.exp(drift + diffusion * gaussian(random));
      path.push(value);
    }
    paths.push(path);
  }

  const bands: PercentilePoint[] = [];
  for (let month = 0; month <= months; month += 1) {
    const slice = paths.map((path) => path[month]).sort((a, b) => a - b);
    bands.push({
      month,
      label: month === 0 ? "Now" : monthLabel(month),
      p5: percentile(slice, 0.05),
      p50: percentile(slice, 0.5),
      p95: percentile(slice, 0.95),
    });
  }

  return { paths, bands };
}
