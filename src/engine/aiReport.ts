import { PORTFOLIO_VALUE } from "../data/universe";
import type { AnalystReport, CrisisImpact, Holding, PortfolioMetrics, StressScenario } from "../types";
import { formatCurrency, formatPct } from "./math";

export function buildAnalystReport(
  holdings: Holding[],
  metrics: PortfolioMetrics,
  scenario: StressScenario,
  impact: CrisisImpact,
  revision = 0,
): AnalystReport {
  const sorted = [...holdings].sort((a, b) => b.weight - a.weight);
  const largest = sorted[0];
  const riskBudget = holdings
    .filter((holding) => holding.id === "globalEquities" || holding.id === "techGrowth")
    .reduce((acc, holding) => acc + holding.weight, 0);
  const defensive = holdings
    .filter((holding) => holding.id === "govBonds" || holding.id === "gold" || holding.id === "cash")
    .reduce((acc, holding) => acc + holding.weight, 0);
  const tech = holdings.find((holding) => holding.id === "techGrowth");
  const cash = holdings.find((holding) => holding.id === "cash");
  const gold = holdings.find((holding) => holding.id === "gold");
  const bonds = holdings.find((holding) => holding.id === "govBonds");

  const concentration = largest.weight > 0.4 ? "High" : largest.weight > 0.28 ? "Medium" : "Low";

  const vulnerabilities: AnalystReport["vulnerabilities"] = [
    {
      title: `${largest.name} concentration`,
      severity: concentration,
      detail: `${largest.name} is ${formatPct(largest.weight, 1)} of NAV. In ${scenario.name}, that sleeve dominates path-dependent P&L and recovery time.`,
    },
    {
      title: "Equity beta cluster",
      severity: riskBudget > 0.65 ? "High" : riskBudget > 0.5 ? "Medium" : "Low",
      detail: `Risk assets are ${formatPct(riskBudget, 1)} of the book (beta proxy ${metrics.betaToEquities.toFixed(2)}). ${scenario.era} historically punished this cluster before diversifiers could offset.`,
    },
    {
      title: "Liquidity under stress",
      severity:
        impact.liquidityRisk === "Severe" || impact.liquidityRisk === "Elevated"
          ? "High"
          : impact.liquidityRisk === "Moderate"
            ? "Medium"
            : "Low",
      detail: `Stressed liquidity score is ${(impact.liquidityScore * 100).toFixed(0)} / 100 (${impact.liquidityRisk}). Cash is ${formatPct(cash?.weight ?? 0, 1)}; that is the only sleeve that can meet redemptions without selling into the gap.`,
    },
  ];

  if ((tech?.weight ?? 0) > 0.18 && (scenario.id === "techCorrection" || scenario.id === "gfc2008")) {
    vulnerabilities.push({
      title: "Growth-duration overlap",
      severity: "High",
      detail: `Tech Growth at ${formatPct(tech?.weight ?? 0, 1)} adds a second equity factor with higher vol (${formatPct(tech?.volatility ?? 0)}). A multiple compression event compounds Global Equities rather than diversifying them.`,
    });
  }

  if (scenario.id === "stagflation" && (bonds?.weight ?? 0) > 0.15) {
    vulnerabilities.push({
      title: "Duration is not a hedge here",
      severity: "Medium",
      detail: `Government Bonds are ${formatPct(bonds?.weight ?? 0, 1)}. In a hike-and-inflation analog they sell off with equities, so the usual 60/40 ballast fails.`,
    });
  }

  const hedges: AnalystReport["hedges"] = [];

  if (riskBudget > 0.55) {
    hedges.push({
      title: "Trim the equity stack by 6–10%",
      detail: `Rotate from ${largest.name} into Cash & T-Bills to cut parametric VaR (${formatCurrency(metrics.var95)}) without abandoning long-run yield of ${formatPct(metrics.expectedYield)}.`,
    });
  } else {
    hedges.push({
      title: "Hold risk budget, add convexity",
      detail:
        "Equity exposure is already contained. Prefer listed put spreads or a small gold overlay rather than a blunt de-risk that would sacrifice expected yield.",
    });
  }

  if ((gold?.weight ?? 0) < 0.12 && scenario.id === "stagflation") {
    hedges.push({
      title: "Lift gold toward 15%",
      detail: "In a stagflation analog, gold is the only sleeve with a persistently positive monthly contribution. Fund it from duration, not from cash.",
    });
  } else {
    hedges.push({
      title: "Keep gold as a crisis coupon",
      detail: `Gold at ${formatPct(gold?.weight ?? 0, 1)} already dampens the left tail. Rebalance mechanically after an 8% sleeve drift rather than adding discretionary size.`,
    });
  }

  if ((cash?.weight ?? 0) < 0.1) {
    hedges.push({
      title: "Pre-fund a 10% liquidity sleeve",
      detail: `Capital at risk is ${formatCurrency(impact.capitalAtRisk)}. A larger T-bill buffer lets you avoid realizing ${formatPct(impact.maxDrawdown)} drawdowns to meet outflows.`,
    });
  } else {
    hedges.push({
      title: "Use cash as dry powder, not yield",
      detail: `The liquidity sleeve is adequate. Deploy it only after the stressed path prints a trough (around month ${impact.troughMonth}) rather than averaging in through the first shock.`,
    });
  }

  if (scenario.id === "techCorrection" && (tech?.weight ?? 0) > 0.15) {
    hedges.push({
      title: "Barbell tech: quality vs. beta",
      detail:
        "Split Tech Growth into profitable mega-cap and a smaller high-beta residual. That reduces scenario max drawdown more efficiently than cutting Global Equities.",
    });
  }

  const rotated = [...hedges.slice(revision % hedges.length), ...hedges.slice(0, revision % hedges.length)];

  const posture =
    impact.maxDrawdown > 0.28
      ? "Defensive — reduce risk assets before the path hits trough."
      : impact.maxDrawdown > 0.16
        ? "Selective — rebalance, do not capitulate."
        : "Constructive — the book can absorb this analog with modest overlays.";

  return {
    headline: `${scenario.name}: ${formatPct(impact.maxDrawdown)} peak-to-trough on ${formatCurrency(PORTFOLIO_VALUE)} NAV`,
    thesis: `Memo ${revision + 1}. Under ${scenario.name}, the current mix (${formatPct(riskBudget)} risk assets / ${formatPct(defensive)} defensive) produces a ${formatPct(impact.maxDrawdown)} maximum drawdown and ${formatCurrency(impact.capitalAtRisk)} capital at risk. Annualized expected yield is ${formatPct(metrics.expectedYield)} with volatility ${formatPct(metrics.volatility)} and Sharpe ${metrics.sharpe.toFixed(2)}. ${scenario.summary}`,
    vulnerabilities: vulnerabilities.slice(0, 4),
    hedges: rotated.slice(0, 4),
    posture,
  };
}
