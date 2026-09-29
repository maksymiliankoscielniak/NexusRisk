import type { AssetDefinition, AssetId, Holding } from "../types";

export const PORTFOLIO_VALUE = 12_400_000;
export const RISK_FREE_RATE = 0.042;
export const HORIZON_MONTHS = 24;
export const MONTE_CARLO_PATHS = 160;

export const ASSETS: AssetDefinition[] = [
  {
    id: "globalEquities",
    name: "Global Equities",
    sleeve: "Risk assets",
    expectedReturn: 0.085,
    volatility: 0.16,
    liquidity: 0.92,
    color: "#3dcca8",
  },
  {
    id: "techGrowth",
    name: "Tech Growth",
    sleeve: "Satellite",
    expectedReturn: 0.124,
    volatility: 0.245,
    liquidity: 0.88,
    color: "#5b8cff",
  },
  {
    id: "govBonds",
    name: "Government Bonds",
    sleeve: "Duration",
    expectedReturn: 0.034,
    volatility: 0.055,
    liquidity: 0.96,
    color: "#c9a227",
  },
  {
    id: "gold",
    name: "Gold",
    sleeve: "Real assets",
    expectedReturn: 0.046,
    volatility: 0.15,
    liquidity: 0.82,
    color: "#e08a4a",
  },
  {
    id: "cash",
    name: "Cash & T-Bills",
    sleeve: "Liquidity",
    expectedReturn: 0.041,
    volatility: 0.004,
    liquidity: 1,
    color: "#8b95a7",
  },
];

export const DEFAULT_WEIGHTS: Record<AssetId, number> = {
  globalEquities: 0.38,
  techGrowth: 0.22,
  govBonds: 0.2,
  gold: 0.12,
  cash: 0.08,
};

export const ASSET_ORDER: AssetId[] = ASSETS.map((asset) => asset.id);

export const CORRELATION: Record<AssetId, Record<AssetId, number>> = {
  globalEquities: {
    globalEquities: 1,
    techGrowth: 0.82,
    govBonds: -0.12,
    gold: 0.08,
    cash: 0.02,
  },
  techGrowth: {
    globalEquities: 0.82,
    techGrowth: 1,
    govBonds: -0.18,
    gold: 0.02,
    cash: 0.01,
  },
  govBonds: {
    globalEquities: -0.12,
    techGrowth: -0.18,
    govBonds: 1,
    gold: 0.16,
    cash: 0.22,
  },
  gold: {
    globalEquities: 0.08,
    techGrowth: 0.02,
    govBonds: 0.16,
    gold: 1,
    cash: 0.05,
  },
  cash: {
    globalEquities: 0.02,
    techGrowth: 0.01,
    govBonds: 0.22,
    gold: 0.05,
    cash: 1,
  },
};

export function createHoldings(weights: Record<AssetId, number>): Holding[] {
  return ASSETS.map((asset) => ({
    ...asset,
    weight: weights[asset.id],
  }));
}
