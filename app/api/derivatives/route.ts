import { NextResponse } from 'next/server';

const API_BASE = 'https://api.coinalyze.net/v1';
const SYMBOL = 'BTCUSDT_PERP.A';

interface CacheEntry {
  data: DerivativesData;
  fetchedAt: number;
}

interface DerivativesData {
  openInterest: { value: number | null; change24h: number | null };
  fundingRate: { value: number | null; predicted: number | null };
  liquidations24h: { long: number | null; short: number | null; total: number | null };
  longShortRatio: { ratio: number | null; longPct: number | null; shortPct: number | null };
  source: string;
}

let cache: CacheEntry | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

async function coinalyzeFetch(endpoint: string, params: Record<string, string> = {}) {
  const apiKey = process.env.COINALYZE_API_KEY;
  if (!apiKey) return null;

  const qs = new URLSearchParams({ symbols: SYMBOL, ...params }).toString();
  const res = await fetch(`${API_BASE}/${endpoint}?${qs}`, {
    headers: { api_key: apiKey },
  });

  if (!res.ok) return null;
  return res.json();
}

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 86400;

    const [
      oiCurrent,
      oiHistory,
      fundingCurrent,
      fundingPredicted,
      liqHistory,
      lsHistory,
      priceRes,
    ] = await Promise.all([
      coinalyzeFetch('open-interest'),
      coinalyzeFetch('open-interest-history', {
        interval: 'daily',
        from: String(oneDayAgo),
        to: String(now),
      }),
      coinalyzeFetch('funding-rate'),
      coinalyzeFetch('predicted-funding-rate'),
      coinalyzeFetch('liquidation-history', {
        interval: 'daily',
        from: String(oneDayAgo),
        to: String(now),
      }),
      coinalyzeFetch('long-short-ratio-history', {
        interval: 'daily',
        from: String(oneDayAgo),
        to: String(now),
      }),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
    ]);

    const btcPrice = priceRes?.bitcoin?.usd ?? 0;

    // Open Interest: current value + 24h change
    let oiValue: number | null = null;
    let oiChange: number | null = null;

    if (oiCurrent?.[0]) {
      const raw = oiCurrent[0].value ?? oiCurrent[0].c ?? null;
      oiValue = raw !== null && btcPrice > 0 ? raw * btcPrice : raw;
    }
    if (oiHistory?.[0]?.history?.length >= 2) {
      const h = oiHistory[0].history;
      const latest = h[h.length - 1].c;
      const prev = h[0].o;
      if (latest && prev) {
        oiChange = ((latest - prev) / prev) * 100;
      }
    } else if (oiHistory?.[0]?.history?.length === 1) {
      const h = oiHistory[0].history[0];
      if (h.o && h.c) {
        oiChange = ((h.c - h.o) / h.o) * 100;
      }
    }

    // Funding Rate: current + predicted
    let fundingValue: number | null = null;
    let fundingPred: number | null = null;

    if (fundingCurrent?.[0]) {
      fundingValue = fundingCurrent[0].value ?? fundingCurrent[0].c ?? null;
    }
    if (fundingPredicted?.[0]) {
      fundingPred = fundingPredicted[0].value ?? fundingPredicted[0].c ?? null;
    }

    // Liquidations: sum last 24h long + short
    let liqLong: number | null = null;
    let liqShort: number | null = null;

    if (liqHistory?.[0]?.history?.length > 0) {
      const entries = liqHistory[0].history;
      const rawLong = entries.reduce((sum: number, e: { l: number }) => sum + (e.l || 0), 0);
      const rawShort = entries.reduce((sum: number, e: { s: number }) => sum + (e.s || 0), 0);
      liqLong = btcPrice > 0 ? rawLong * btcPrice : rawLong;
      liqShort = btcPrice > 0 ? rawShort * btcPrice : rawShort;
    }

    // Long/Short Ratio: latest
    let lsRatio: number | null = null;
    let longPct: number | null = null;
    let shortPct: number | null = null;

    if (lsHistory?.[0]?.history?.length > 0) {
      const latest = lsHistory[0].history[lsHistory[0].history.length - 1];
      lsRatio = latest.r ?? null;
      longPct = latest.l ?? null;
      shortPct = latest.s ?? null;
    }

    const data: DerivativesData = {
      openInterest: { value: oiValue, change24h: oiChange },
      fundingRate: { value: fundingValue, predicted: fundingPred },
      liquidations24h: {
        long: liqLong,
        short: liqShort,
        total: liqLong !== null && liqShort !== null ? liqLong + liqShort : null,
      },
      longShortRatio: { ratio: lsRatio, longPct, shortPct },
      source: 'coinalyze',
    };

    cache = { data, fetchedAt: Date.now() };
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      {
        openInterest: { value: null, change24h: null },
        fundingRate: { value: null, predicted: null },
        liquidations24h: { long: null, short: null, total: null },
        longShortRatio: { ratio: null, longPct: null, shortPct: null },
        source: 'error',
      },
      { status: 502 }
    );
  }
}
