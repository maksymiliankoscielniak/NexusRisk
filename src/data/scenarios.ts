import { HORIZON_MONTHS } from "./universe";
import type { AssetId, StressScenario } from "../types";

function series(values: number[]): number[] {
  if (values.length !== HORIZON_MONTHS) {
    throw new Error(`Scenario series must be ${HORIZON_MONTHS} months`);
  }
  return values;
}

function blend(pattern: number[], fill: number): number[] {
  const out = [...pattern];
  while (out.length < HORIZON_MONTHS) {
    out.push(fill);
  }
  return series(out.slice(0, HORIZON_MONTHS));
}

const crisis2008: Record<AssetId, number[]> = {
  globalEquities: series([
    -0.062, -0.078, -0.094, -0.071, -0.048, -0.082, -0.055, -0.041, -0.018, 0.012, 0.028, 0.035,
    0.022, 0.018, 0.031, 0.024, 0.019, 0.027, 0.021, 0.016, 0.023, 0.018, 0.02, 0.017,
  ]),
  techGrowth: series([
    -0.081, -0.096, -0.112, -0.088, -0.061, -0.094, -0.07, -0.052, -0.022, 0.018, 0.036, 0.044,
    0.03, 0.024, 0.038, 0.029, 0.022, 0.033, 0.026, 0.02, 0.028, 0.021, 0.024, 0.019,
  ]),
  govBonds: series([
    0.018, 0.022, 0.031, 0.016, 0.012, 0.009, 0.014, 0.011, 0.008, 0.006, 0.005, 0.004,
    0.005, 0.004, 0.006, 0.005, 0.004, 0.005, 0.004, 0.004, 0.005, 0.004, 0.004, 0.004,
  ]),
  gold: series([
    0.042, 0.018, -0.021, 0.031, 0.024, 0.011, 0.028, 0.016, 0.009, 0.014, 0.011, 0.008,
    0.01, 0.007, 0.012, 0.008, 0.006, 0.009, 0.007, 0.006, 0.008, 0.006, 0.007, 0.006,
  ]),
  cash: blend(Array.from({ length: HORIZON_MONTHS }, () => 0.0015), 0.0015),
};

const crash2020: Record<AssetId, number[]> = {
  globalEquities: series([
    -0.021, -0.132, -0.148, 0.126, 0.048, 0.031, 0.042, 0.028, 0.019, 0.024, 0.021, 0.017,
    0.018, 0.015, 0.02, 0.016, 0.014, 0.018, 0.015, 0.013, 0.016, 0.014, 0.015, 0.013,
  ]),
  techGrowth: series([
    -0.018, -0.118, -0.162, 0.168, 0.072, 0.048, 0.055, 0.036, 0.028, 0.031, 0.026, 0.022,
    0.024, 0.02, 0.026, 0.021, 0.018, 0.023, 0.019, 0.017, 0.021, 0.018, 0.019, 0.016,
  ]),
  govBonds: series([
    0.012, 0.028, 0.018, -0.006, 0.004, 0.003, 0.002, 0.002, 0.003, 0.002, 0.002, 0.002,
    0.002, 0.002, 0.003, 0.002, 0.002, 0.002, 0.002, 0.002, 0.002, 0.002, 0.002, 0.002,
  ]),
  gold: series([
    0.008, 0.041, -0.012, 0.036, 0.018, 0.011, 0.014, 0.009, 0.007, 0.008, 0.006, 0.005,
    0.006, 0.005, 0.007, 0.005, 0.004, 0.006, 0.005, 0.004, 0.005, 0.004, 0.005, 0.004,
  ]),
  cash: blend(Array.from({ length: HORIZON_MONTHS }, () => 0.0008), 0.0008),
};

const stagflation: Record<AssetId, number[]> = {
  globalEquities: series([
    -0.028, -0.031, -0.024, -0.018, -0.022, -0.016, -0.012, -0.019, -0.014, -0.008, 0.004, 0.008,
    -0.006, -0.011, 0.003, 0.007, -0.005, 0.006, 0.009, 0.004, 0.008, 0.006, 0.01, 0.007,
  ]),
  techGrowth: series([
    -0.042, -0.051, -0.038, -0.029, -0.034, -0.026, -0.021, -0.031, -0.024, -0.014, 0.002, 0.006,
    -0.012, -0.018, 0.001, 0.005, -0.009, 0.004, 0.007, 0.002, 0.006, 0.004, 0.008, 0.005,
  ]),
  govBonds: series([
    -0.031, -0.028, -0.022, -0.018, -0.016, -0.014, -0.012, -0.011, -0.009, -0.006, -0.004, -0.002,
    0.001, 0.002, 0.003, 0.004, 0.003, 0.004, 0.005, 0.004, 0.005, 0.004, 0.005, 0.004,
  ]),
  gold: series([
    0.036, 0.028, 0.022, 0.018, 0.024, 0.016, 0.014, 0.019, 0.012, 0.01, 0.008, 0.009,
    0.011, 0.008, 0.007, 0.009, 0.006, 0.007, 0.008, 0.006, 0.007, 0.006, 0.008, 0.006,
  ]),
  cash: series([
    0.0032, 0.0036, 0.0038, 0.004, 0.0042, 0.0044, 0.0045, 0.0046, 0.0046, 0.0045, 0.0044, 0.0043,
    0.0042, 0.0041, 0.004, 0.0039, 0.0038, 0.0038, 0.0037, 0.0037, 0.0036, 0.0036, 0.0035, 0.0035,
  ]),
};

const techCorrection: Record<AssetId, number[]> = {
  globalEquities: series([
    -0.018, -0.042, -0.036, -0.028, -0.016, -0.012, 0.008, 0.014, 0.011, 0.009, 0.012, 0.01,
    0.008, 0.011, 0.009, 0.007, 0.01, 0.008, 0.007, 0.009, 0.008, 0.007, 0.008, 0.007,
  ]),
  techGrowth: series([
    -0.048, -0.092, -0.078, -0.061, -0.038, -0.022, 0.016, 0.028, 0.021, 0.018, 0.024, 0.019,
    0.016, 0.021, 0.017, 0.014, 0.018, 0.015, 0.013, 0.016, 0.014, 0.012, 0.015, 0.013,
  ]),
  govBonds: series([
    0.014, 0.018, 0.012, 0.009, 0.007, 0.006, 0.004, 0.003, 0.004, 0.003, 0.003, 0.003,
    0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003,
  ]),
  gold: series([
    0.011, 0.016, 0.009, 0.006, 0.005, 0.004, 0.003, 0.004, 0.003, 0.003, 0.004, 0.003,
    0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003,
  ]),
  cash: blend(Array.from({ length: HORIZON_MONTHS }, () => 0.0034), 0.0034),
};

export const STRESS_SCENARIOS: StressScenario[] = [
  {
    id: "gfc2008",
    name: "2008 Liquidity Crisis",
    era: "Sep 2008 analog",
    summary:
      "Funding markets seize, risk assets gap lower for three quarters, and duration becomes the only reliable ballast.",
    liquidityStress: 0.72,
    monthlyReturns: crisis2008,
  },
  {
    id: "covid2020",
    name: "2020 Market Crash",
    era: "Mar 2020 analog",
    summary:
      "A compressed liquidation followed by a policy-driven V-shape. Drawdown is violent; recovery is unusually fast if liquidity holds.",
    liquidityStress: 0.48,
    monthlyReturns: crash2020,
  },
  {
    id: "stagflation",
    name: "Stagflation & Rate Hikes",
    era: "1970s / 2022 analog",
    summary:
      "Growth stalls while inflation stays sticky. Equities and bonds sell off together; real assets and cash carry the book.",
    liquidityStress: 0.36,
    monthlyReturns: stagflation,
  },
  {
    id: "techCorrection",
    name: "Tech Correction",
    era: "2000 / 2022 analog",
    summary:
      "Multiple compression in growth and duration-sensitive tech, with a milder spillover into global equities and a bid for quality bonds.",
    liquidityStress: 0.28,
    monthlyReturns: techCorrection,
  },
];

export const DEFAULT_SCENARIO_ID = STRESS_SCENARIOS[0].id;
