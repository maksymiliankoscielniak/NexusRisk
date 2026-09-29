import type { CrisisImpact, Holding, PathPoint, StressScenario, TimeRange } from "../types";
import { monthLabel } from "./math";

const RANGE_MONTHS: Record<TimeRange, number> = {
  "1M": 1,
  "3M": 3,
  "6M": 6,
  "1Y": 12,
  "2Y": 24,
};

export function projectPaths(
  holdings: Holding[],
  scenario: StressScenario,
  range: TimeRange,
  portfolioValue: number,
): PathPoint[] {
  const months = RANGE_MONTHS[range];
  const points: PathPoint[] = [
    { month: 0, label: "Now", baseline: portfolioValue, stressed: portfolioValue },
  ];

  let baseline = portfolioValue;
  let stressed = portfolioValue;

  for (let month = 1; month <= months; month += 1) {
    const baselineReturn = holdings.reduce(
      (acc, holding) => acc + holding.weight * (holding.expectedReturn / 12),
      0,
    );
    const stressedReturn = holdings.reduce((acc, holding) => {
      const shock = scenario.monthlyReturns[holding.id][month - 1] ?? 0;
      return acc + holding.weight * shock;
    }, 0);

    baseline *= 1 + baselineReturn;
    stressed *= 1 + stressedReturn;
    points.push({ month, label: monthLabel(month), baseline, stressed });
  }

  return points;
}

export function computeCrisisImpact(
  holdings: Holding[],
  scenario: StressScenario,
  path: PathPoint[],
  portfolioValue: number,
): CrisisImpact {
  let peak = path[0]?.stressed ?? portfolioValue;
  let maxDrawdown = 0;
  let troughValue = peak;
  let troughMonth = 0;

  for (const point of path) {
    peak = Math.max(peak, point.stressed);
    const drawdown = peak > 0 ? (peak - point.stressed) / peak : 0;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      troughValue = point.stressed;
      troughMonth = point.month;
    }
  }

  let recoveryMonths: number | null = null;
  const start = path[0]?.stressed ?? portfolioValue;
  const recoveryTarget = start * 0.98;
  for (const point of path) {
    if (point.month > troughMonth && point.stressed >= recoveryTarget) {
      recoveryMonths = point.month - troughMonth;
      break;
    }
  }

  const liquidityScore = holdings.reduce((acc, holding) => {
    const stressedLiquidity = holding.liquidity * (1 - scenario.liquidityStress * (1 - holding.liquidity));
    return acc + holding.weight * stressedLiquidity;
  }, 0);

  let liquidityRisk: CrisisImpact["liquidityRisk"] = "Low";
  if (liquidityScore < 0.62) liquidityRisk = "Severe";
  else if (liquidityScore < 0.74) liquidityRisk = "Elevated";
  else if (liquidityScore < 0.86) liquidityRisk = "Moderate";

  return {
    maxDrawdown,
    capitalAtRisk: portfolioValue * maxDrawdown,
    recoveryMonths,
    liquidityRisk,
    liquidityScore,
    troughMonth,
    troughValue,
  };
}
