import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_SCENARIO_ID, STRESS_SCENARIOS } from "../data/scenarios";
import { ASSETS, createHoldings, DEFAULT_WEIGHTS } from "../data/universe";
import { DEFAULT_PRESET_ID, PRESETS } from "../data/presets";
import { buildAnalystReport } from "../engine/aiReport";
import { computePortfolioMetrics, rebalanceWeight } from "../engine/math";
import { runMonteCarlo } from "../engine/monteCarlo";
import { computeCrisisImpact, projectPaths } from "../engine/stress";
import { fetchMarketData, clearCache } from "../services/marketData";
import type { AssetId, Holding, TimeRange } from "../types";

export type DataStatus = "loading" | "live" | "mock";

/* ── localStorage helpers ─────────────────────────────────── */

const STORAGE_KEY = "nexusrisk-portfolio-v2";

interface PersistedState {
  portfolioValue: number;
  weights:        Record<AssetId, number>;
  activePresetId: string | null;
  timeRange:      TimeRange;
  scenarioId:     string;
}

function loadFromStorage(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

function saveToStorage(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* storage full — silently skip */ }
}

/* ── Helper to build initial state ────────────────────────── */

function buildInitialState() {
  const saved = loadFromStorage();
  const hedgeFundPreset = PRESETS.find((p) => p.id === DEFAULT_PRESET_ID)!;

  return {
    portfolioValue: saved?.portfolioValue ?? hedgeFundPreset.value,
    weights:        saved?.weights        ?? DEFAULT_WEIGHTS,
    activePresetId: saved?.activePresetId ?? DEFAULT_PRESET_ID,
    timeRange:      (saved?.timeRange     ?? "2Y") as TimeRange,
    scenarioId:     saved?.scenarioId     ?? DEFAULT_SCENARIO_ID,
  };
}

/* ── Context ──────────────────────────────────────────────── */

const PortfolioContext = createContext<ReturnType<typeof usePortfolioStore> | null>(null);

function usePortfolioStore() {
  const initial = useMemo(buildInitialState, []);

  const [holdings, setHoldings]             = useState<Holding[]>(() => createHoldings(initial.weights));
  const [portfolioValue, setPortfolioValue_] = useState<number>(initial.portfolioValue);
  const [activePresetId, setActivePresetId_] = useState<string | null>(initial.activePresetId);
  const [timeRange, setTimeRange_]           = useState<TimeRange>(initial.timeRange);
  const [scenarioId, setScenarioId_]         = useState(initial.scenarioId);
  const [simulationNonce, setSimulationNonce] = useState(0);
  const [reportNonce, setReportNonce]         = useState(0);
  const [highlightStress, setHighlightStress] = useState(false);
  const [customizerOpen, setCustomizerOpen]   = useState(false);

  // Data status
  const [dataStatus, setDataStatus]       = useState<DataStatus>("loading");
  const [dataFetchedAt, setDataFetchedAt] = useState<Date | null>(null);
  const [dataError, setDataError]         = useState<string | null>(null);
  const [nextRefreshIn, setNextRefreshIn] = useState<number>(60);

  /* ── Persist on every meaningful change ──────────────────── */
  useEffect(() => {
    const weights = Object.fromEntries(holdings.map((h) => [h.id, h.weight])) as Record<AssetId, number>;
    saveToStorage({ portfolioValue, weights, activePresetId, timeRange, scenarioId });
  }, [portfolioValue, holdings, activePresetId, timeRange, scenarioId]);

  /* ── Setters with persist ─────────────────────────────────── */
  const setPortfolioValue = useCallback((v: number) => {
    setPortfolioValue_(Math.max(1, v));
    setActivePresetId_(null); // custom value clears preset
  }, []);

  const setTimeRange = useCallback((r: TimeRange) => setTimeRange_(r), []);
  const setScenarioId = useCallback((id: string) => setScenarioId_(id), []);

  /* ── Live market data ─────────────────────────────────────── */
  const runFetch = useCallback((cancelled: { current: boolean }) => {
    setDataStatus("loading");
    setDataError(null);
    fetchMarketData()
      .then((liveData) => {
        if (cancelled.current) return;
        setHoldings((prev) =>
          prev.map((holding) => {
            const live = liveData.assets[holding.id as AssetId];
            if (!live) return holding;
            return { ...holding, expectedReturn: live.expectedReturn, volatility: live.volatility };
          })
        );
        ASSETS.forEach((asset) => {
          const live = liveData.assets[asset.id as AssetId];
          if (live) {
            asset.expectedReturn = live.expectedReturn;
            asset.volatility     = live.volatility;
          }
        });
        setDataStatus("live");
        setDataFetchedAt(liveData.fetchedAt);
      })
      .catch((err) => {
        if (cancelled.current) return;
        console.warn("[NexusRisk] Market data fetch failed:", err?.message ?? err);
        setDataError(null);
        setDataStatus("mock");
      });
  }, []);

  useEffect(() => {
    const cancelled = { current: false };
    runFetch(cancelled);
    return () => { cancelled.current = true; };
  }, [runFetch]);

  const retryMarketData = useCallback(() => {
    clearCache();
    const cancelled = { current: false };
    runFetch(cancelled);
  }, [runFetch]);

  // 60s auto-refresh countdown (only when live)
  useEffect(() => {
    if (dataStatus !== "live") return;
    setNextRefreshIn(60);
    const tickId    = window.setInterval(() => setNextRefreshIn((p) => (p <= 1 ? 60 : p - 1)), 1_000);
    const refreshId = window.setInterval(() => {
      clearCache();
      const cancelled = { current: false };
      runFetch(cancelled);
    }, 60_000);
    return () => { clearInterval(tickId); clearInterval(refreshId); };
  }, [dataStatus, dataFetchedAt, runFetch]);

  /* ── Derived state ────────────────────────────────────────── */
  const scenario = useMemo(
    () => STRESS_SCENARIOS.find((item) => item.id === scenarioId) ?? STRESS_SCENARIOS[0],
    [scenarioId],
  );

  const metrics    = useMemo(() => computePortfolioMetrics(holdings, portfolioValue), [holdings, portfolioValue]);
  const stressPath = useMemo(() => projectPaths(holdings, scenario, timeRange, portfolioValue), [holdings, scenario, timeRange, portfolioValue]);
  const impact     = useMemo(() => computeCrisisImpact(holdings, scenario, stressPath, portfolioValue), [holdings, scenario, stressPath, portfolioValue]);
  const monteCarlo = useMemo(() => runMonteCarlo(holdings, timeRange, 20240928 + simulationNonce), [holdings, timeRange, simulationNonce]);
  const report     = useMemo(() => buildAnalystReport(holdings, metrics, scenario, impact, reportNonce), [holdings, metrics, scenario, impact, reportNonce]);

  /* ── Actions ──────────────────────────────────────────────── */
  const updateWeight = useCallback((assetId: AssetId, weight: number) => {
    setHoldings((current) => rebalanceWeight(current, assetId, weight));
    setActivePresetId_(null); // custom weights clear preset
  }, []);

  const resetAllocations = useCallback(() => {
    setHoldings(createHoldings(DEFAULT_WEIGHTS));
    setPortfolioValue_(PRESETS.find((p) => p.id === DEFAULT_PRESET_ID)!.value);
    setActivePresetId_(DEFAULT_PRESET_ID);
  }, []);

  const applyPreset = useCallback((presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setHoldings(createHoldings(preset.weights));
    setPortfolioValue_(preset.value);
    setActivePresetId_(presetId);
  }, []);

  // Save custom portfolio from customizer (value + weights in one go)
  const applyCustomPortfolio = useCallback(
    (value: number, weights: Record<AssetId, number>) => {
      setPortfolioValue_(Math.max(1, value));
      setHoldings(createHoldings(weights));
      setActivePresetId_(null);
    },
    [],
  );

  const runCrisisSimulation = useCallback(() => {
    setTimeRange_("2Y");
    setScenarioId_("gfc2008");
    setSimulationNonce((v) => v + 1);
    setReportNonce((v) => v + 1);
    setHighlightStress(true);
    window.setTimeout(() => setHighlightStress(false), 1600);
    document.getElementById("stress-module")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const rerunMonteCarlo  = useCallback(() => setSimulationNonce((v) => v + 1), []);
  const reevaluateReport = useCallback(() => setReportNonce((v) => v + 1), []);

  return {
    // State
    holdings,
    portfolioValue,
    activePresetId,
    timeRange,
    scenario,
    scenarios: STRESS_SCENARIOS,
    presets:   PRESETS,
    metrics,
    stressPath,
    impact,
    monteCarlo,
    report,
    reportNonce,
    highlightStress,
    customizerOpen,
    dataStatus,
    dataFetchedAt,
    dataError,
    nextRefreshIn,
    // Actions
    setPortfolioValue,
    setTimeRange,
    setScenarioId,
    applyPreset,
    applyCustomPortfolio,
    updateWeight,
    resetAllocations,
    runCrisisSimulation,
    rerunMonteCarlo,
    reevaluateReport,
    retryMarketData,
    setCustomizerOpen,
  };
}

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const store = usePortfolioStore();
  return <PortfolioContext.Provider value={store}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) throw new Error("usePortfolio must be used within PortfolioProvider");
  return context;
}
