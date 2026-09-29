import type { AssetId } from "../types";

export interface Preset {
  id:          string;
  name:        string;
  emoji:       string;
  description: string;
  value:       number;
  weights:     Record<AssetId, number>;
}

export const PRESETS: Preset[] = [
  {
    id:          "hedge-fund",
    name:        "Demo Hedge Fund",
    emoji:       "🏦",
    description: "$12.4M multi-asset institutional book",
    value:       12_400_000,
    weights: {
      globalEquities: 0.38,
      techGrowth:     0.22,
      govBonds:       0.20,
      gold:           0.12,
      cash:           0.08,
    },
  },
  {
    id:          "boglehead",
    name:        "Retail Boglehead",
    emoji:       "📈",
    description: "80% All-World ETF / 20% Bonds — passive, low-cost",
    value:       50_000,
    weights: {
      globalEquities: 0.80,
      govBonds:       0.20,
      techGrowth:     0.00,
      gold:           0.00,
      cash:           0.00,
    },
  },
  {
    id:          "tech-growth",
    name:        "Tech Heavy Growth",
    emoji:       "🚀",
    description: "70% Nasdaq / 20% Global Equities / 10% Cash",
    value:       100_000,
    weights: {
      techGrowth:     0.70,
      globalEquities: 0.20,
      cash:           0.10,
      govBonds:       0.00,
      gold:           0.00,
    },
  },
  {
    id:          "all-weather",
    name:        "All-Weather Defensive",
    emoji:       "🛡️",
    description: "30% Eq / 40% Long Bonds / 15% Short Bonds / 7.5% Gold / 7.5% Cash",
    value:       200_000,
    weights: {
      globalEquities: 0.30,
      govBonds:       0.40,
      techGrowth:     0.15,
      gold:           0.075,
      cash:           0.075,
    },
  },
];

export const DEFAULT_PRESET_ID = "hedge-fund";
