export type TimeRange = "1M" | "3M" | "6M" | "1Y" | "2Y";

export type AssetId =
  | "globalEquities"
  | "techGrowth"
  | "govBonds"
  | "gold"
  | "cash";

export interface AssetDefinition {
  id: AssetId;
  name: string;
  sleeve: string;
  expectedReturn: number;
  volatility: number;
  liquidity: number;
  color: string;
}

export interface Holding extends AssetDefinition {
  weight: number;
}

export interface PortfolioMetrics {
  value: number;
  expectedYield: number;
  volatility: number;
  sharpe: number;
  var95: number;
  betaToEquities: number;
}

export interface StressScenario {
  id: string;
  name: string;
  era: string;
  summary: string;
  liquidityStress: number;
  monthlyReturns: Record<AssetId, number[]>;
}

export interface PathPoint {
  month: number;
  label: string;
  baseline: number;
  stressed: number;
}

export interface CrisisImpact {
  maxDrawdown: number;
  capitalAtRisk: number;
  recoveryMonths: number | null;
  liquidityRisk: "Low" | "Moderate" | "Elevated" | "Severe";
  liquidityScore: number;
  troughMonth: number;
  troughValue: number;
}

export interface PercentilePoint {
  month: number;
  label: string;
  p5: number;
  p50: number;
  p95: number;
}

export interface MonteCarloResult {
  paths: number[][];
  bands: PercentilePoint[];
}

export interface AnalystReport {
  headline: string;
  thesis: string;
  vulnerabilities: { title: string; detail: string; severity: "Low" | "Medium" | "High" }[];
  hedges: { title: string; detail: string }[];
  posture: string;
}
