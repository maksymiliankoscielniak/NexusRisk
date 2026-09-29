import { CORRELATION, RISK_FREE_RATE } from "../data/universe";
import type { Holding, PortfolioMetrics } from "../types";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function sum(values: number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function formatCurrency(value: number, digits = 0): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) {
    return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  }
  return `${sign}$${abs.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })}`;
}

export function formatPct(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatMonths(value: number | null): string {
  if (value === null) return "> 24 mo";
  if (value === 0) return "Immediate";
  return `${value} mo`;
}

export function monthLabel(month: number): string {
  return `M${month}`;
}

export function computePortfolioMetrics(
  holdings: Holding[],
  portfolioValue: number,
): PortfolioMetrics {
  const expectedYield = holdings.reduce(
    (acc, holding) => acc + holding.weight * holding.expectedReturn,
    0,
  );

  let variance = 0;
  for (const left of holdings) {
    for (const right of holdings) {
      const rho = CORRELATION[left.id][right.id];
      variance += left.weight * right.weight * left.volatility * right.volatility * rho;
    }
  }

  const volatility = Math.sqrt(Math.max(variance, 0));
  const sharpe = volatility > 0 ? (expectedYield - RISK_FREE_RATE) / volatility : 0;
  const annualLoss = 1.64485 * volatility - expectedYield;
  const var95 = Math.max(0, portfolioValue * annualLoss);

  const equitySleeve = holdings.find((holding) => holding.id === "globalEquities");
  const techSleeve   = holdings.find((holding) => holding.id === "techGrowth");
  const betaToEquities =
    (equitySleeve?.weight ?? 0) * 1 + (techSleeve?.weight ?? 0) * 1.35;

  return {
    value: portfolioValue,
    expectedYield,
    volatility,
    sharpe,
    var95,
    betaToEquities,
  };
}

export function rebalanceWeight(
  holdings: Holding[],
  assetId: Holding["id"],
  nextWeight: number,
): Holding[] {
  const target = clamp(nextWeight, 0, 1);
  const others = holdings.filter((holding) => holding.id !== assetId);
  const remaining = 1 - target;
  const otherSum = sum(others.map((holding) => holding.weight));

  return holdings.map((holding) => {
    if (holding.id === assetId) {
      return { ...holding, weight: target };
    }
    if (otherSum <= 0) {
      return { ...holding, weight: remaining / others.length };
    }
    return { ...holding, weight: (holding.weight / otherSum) * remaining };
  });
}
