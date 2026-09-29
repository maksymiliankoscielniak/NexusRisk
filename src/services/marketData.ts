/**
 * NexusRisk — Live Market Data Service
 *
 * Fetches real-time ETF data from a public Google Sheet (acting as a free, 100% CORS-friendly API).
 *
 * ETF mapping:
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

// Published Google Sheet CSV
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRkJPpn_LoJRMkI9xVpMIkQbt2YYnvCcseHyaldGMahYlKmKMpa6uGPNZLbmLzPNZuCFxZv4UWASQG2/pub?output=csv";

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
const CACHE_TTL = 58_000; 

export function clearCache() { _cache = null; }

export async function fetchMarketData(): Promise<LiveMarketData> {
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) return _cache.data;

  // 1. Fetch the CSV from Google Sheets
  const resp = await fetch(SHEET_CSV_URL);
  if (!resp.ok) throw new Error(`Google Sheets HTTP ${resp.status}`);
  const text = await resp.text();
  
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 30) throw new Error("Not enough data from Google Sheets");

  // 2. Parse the CSV columns (handling European locales with commas in numbers)
  const assetIds = Object.keys(TICKER_MAP) as AssetId[];
  const series: Record<AssetId, number[]> = {
    globalEquities: [],
    techGrowth: [],
    govBonds: [],
    gold: [],
    cash: []
  };

  // Skip the first row (headers)
  for (let i = 1; i < lines.length; i++) {
    const row: string[] = [];
    let inQuotes = false;
    let current = '';
    
    // Manual CSV split that ignores commas inside quotes
    for (let char of lines[i]) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        row.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current);

    if (row.length >= 10) {
       // Replace European decimal commas with dots and parse to float
       const spy = parseFloat(row[1].replace(',', '.'));
       const qqq = parseFloat(row[3].replace(',', '.'));
       const tlt = parseFloat(row[5].replace(',', '.'));
       const gld = parseFloat(row[7].replace(',', '.'));
       const bil = parseFloat(row[9].replace(',', '.'));
       
       if (!isNaN(spy)) series.globalEquities.push(spy);
       if (!isNaN(qqq)) series.techGrowth.push(qqq);
       if (!isNaN(tlt)) series.govBonds.push(tlt);
       if (!isNaN(gld)) series.gold.push(gld);
       if (!isNaN(bil)) series.cash.push(bil);
    }
  }

  // 3. Calculate Returns and Volatility
  const errors: string[] = [];
  const returnSeries: (number[] | null)[] = assetIds.map(id => {
    const s = series[id];
    if (s.length < 30) {
      errors.push(`Missing data for ${TICKER_MAP[id]}`);
      return null;
    }
    return logReturns(s);
  });

  const successCount = returnSeries.filter(Boolean).length;
  if (successCount < 3) {
    throw new Error(`Only ${successCount}/5 tickers succeeded from Sheets`);
  }

  const assets: Partial<Record<AssetId, LiveAssetData>> = {};
  assetIds.forEach((id, i) => {
    const rs = returnSeries[i];
    if (rs) assets[id] = { expectedReturn: annualReturn(rs), volatility: annualVol(rs) };
  });

  // 4. Calculate Correlation Matrix
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
