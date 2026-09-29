/**
 * NexusRisk — Live Market Data Service
 *
 * Dev  → uses Vite's dev-server proxy at /yf (zero CORS, Node.js fetch)
 * Prod → tries a chain of free CORS proxies until one succeeds
 *
 * ETF proxies:
 *   Global Equities → SPY   (S&P 500)
 *   Tech Growth     → QQQ   (Nasdaq-100)
 *   Government Bonds → TLT  (20+ Year Treasury)
 *   Gold            → GLD   (Gold Trust)
 *   Cash / T-Bills  → BIL   (1-3 Month T-Bill)
 */

import type { AssetId } from "../types";

export const TICKER_MAP: Record<AssetId, string> = {
  globalEquities: "SPY",
  techGrowth:     "QQQ",
  govBonds:       "TLT",
  gold:           "GLD",
  cash:           "BIL",
};

export type LiveAssetData = {
  expectedReturn: number;
  volatility:     number;
};

export type LiveMarketData = {
  assets:       Partial<Record<AssetId, LiveAssetData>>;
  correlation:  Partial<Record<AssetId, Partial<Record<AssetId, number>>>>;
  fetchedAt:    Date;
  successCount: number;
  errors:       string[];
};

/* ── URL strategy ─────────────────────────────────────────── */

function yahooChartPath(ticker: string): string {
  const now        = Math.floor(Date.now() / 1000);
  const oneYearAgo = now - 365 * 24 * 3600;
  return `/v8/finance/chart/${ticker}?interval=1d&period1=${oneYearAgo}&period2=${now}`;
}

function buildUrls(ticker: string): string[] {
  const path      = yahooChartPath(ticker);
  const directUrl = `https://query1.finance.yahoo.com${path}`;

  if (import.meta.env.DEV) {
    // Vite dev-server proxies /yf → query1.finance.yahoo.com (Node.js, no CORS)
    return [`/yf${path}`];
  }

  // Production / GitHub Pages: try multiple free CORS proxies in order
  return [
    `https://corsproxy.io/?${encodeURIComponent(directUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`,
    `https://thingproxy.freeboard.io/fetch/${directUrl}`,
    directUrl, // last-resort direct attempt (works if the user's browser has Yahoo cookies)
  ];
}

/* ── Fetch helpers ────────────────────────────────────────── */

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = window.setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    promise.then(
      (v) => { clearTimeout(id); resolve(v); },
      (e) => { clearTimeout(id); reject(e); },
    );
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPrices(json: any): number[] {
  if (json?.chart?.error) {
    throw new Error(`Yahoo error: ${JSON.stringify(json.chart.error)}`);
  }
  const closes: (number | null)[] =
    json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
  const prices = closes.filter((p): p is number => p !== null && isFinite(p));
  if (prices.length < 30) {
    throw new Error(`Only ${prices.length} prices — response may be empty or auth-blocked`);
  }
  return prices;
}

async function fetchDailyPrices(ticker: string): Promise<number[]> {
  const urls = buildUrls(ticker);
  const errs: string[] = [];

  for (const url of urls) {
    try {
      const resp = await withTimeout(fetch(url), 13_000);
      if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      const json = await resp.json();
      return extractPrices(json);
    } catch (e) {
      const msg = `[${url.slice(0, 40)}…]: ${(e as Error).message}`;
      errs.push(msg);
      console.warn(`[NexusRisk] ${ticker} strategy failed —`, (e as Error).message);
    }
  }

  throw new Error(`All strategies failed for ${ticker}: ${errs.join(" | ")}`);
}

/* ── Maths ────────────────────────────────────────────────── */

function logReturns(prices: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < prices.length; i++) out.push(Math.log(prices[i] / prices[i - 1]));
  return out;
}

const mean   = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
const stddev = (a: number[]) => {
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
};

const annualReturn = (r: number[]) => Math.exp(mean(r) * 252) - 1;
const annualVol    = (r: number[]) => stddev(r) * Math.sqrt(252);

function correlation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  const as = a.slice(0, n), bs = b.slice(0, n);
  const ma = mean(as), mb = mean(bs);
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    num += (as[i] - ma) * (bs[i] - mb);
    da  += (as[i] - ma) ** 2;
    db  += (bs[i] - mb) ** 2;
  }
  return da * db === 0 ? 0 : num / Math.sqrt(da * db);
}

/* ── Public API ───────────────────────────────────────────── */

let _cache: { data: LiveMarketData; ts: number } | null = null;
const CACHE_TTL = 58_000; // just under 60s so the auto-refresh always gets fresh data

export function clearCache() { _cache = null; }

export async function fetchMarketData(): Promise<LiveMarketData> {
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) return _cache.data;

  const assetIds = Object.keys(TICKER_MAP) as AssetId[];

  // Fetch all tickers in parallel — partial success is OK
  const results = await Promise.allSettled(
    assetIds.map((id) => fetchDailyPrices(TICKER_MAP[id]))
  );

  const errors: string[] = [];
  const returnSeries: (number[] | null)[] = results.map((r, i) => {
    if (r.status === "fulfilled") return logReturns(r.value);
    errors.push(`${TICKER_MAP[assetIds[i]]}: ${r.reason?.message ?? r.reason}`);
    return null;
  });

  const successCount = returnSeries.filter(Boolean).length;
  if (successCount < 3) {
    throw new Error(`Only ${successCount}/5 tickers succeeded: ${errors.join("; ")}`);
  }

  const assets: Partial<Record<AssetId, LiveAssetData>> = {};
  assetIds.forEach((id, i) => {
    const rs = returnSeries[i];
    if (rs) assets[id] = { expectedReturn: annualReturn(rs), volatility: annualVol(rs) };
  });

  const corr: Partial<Record<AssetId, Partial<Record<AssetId, number>>>> = {};
  assetIds.forEach((idA, i) => {
    if (!returnSeries[i]) return;
    corr[idA] = {};
    assetIds.forEach((idB, j) => {
      if (!returnSeries[j]) return;
      corr[idA]![idB] = i === j ? 1 : correlation(returnSeries[i]!, returnSeries[j]!);
    });
  });

  const data: LiveMarketData = { assets, correlation: corr, fetchedAt: new Date(), successCount, errors };
  _cache = { data, ts: Date.now() };
  return data;
}
