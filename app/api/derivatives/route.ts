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
  periodEnd?: string;
}

let cache: CacheEntry | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

async function coinalyzeFetch(endpoint: string, params: Record<string, string> = {}) {
  const apiKey = process.env.COINALYZE_API_KEY;
  if (!apiKey) return null;

  const usd: Record<string, string> = ['open-interest', 'open-interest-history', 'liquidation-history'].includes(endpoint)
    ? { convert_to_usd: 'true' } : {};
  const qs = new URLSearchParams({ symbols: SYMBOL, ...usd, ...params }).toString();
  const res = await fetch(`${API_BASE}/${endpoint}?${qs}`, {
    headers: { api_key: apiKey },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return null;
  return res.json();
}

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const now = Math.floor(Date.now() / 3_600_000) * 3600;
    const oneDayAgo = now - 86400;

    const [
      oiCurrent,
      oiHistory,
      fundingCurrent,
      fundingPredicted,
      liqHistory,
      lsHistory,
    ] = await Promise.all([
      coinalyzeFetch('open-interest'),
      coinalyzeFetch('open-interest-history', {
        interval: '1hour',
        from: String(oneDayAgo),
        to: String(now - 1),
      }),
      coinalyzeFetch('funding-rate'),
      coinalyzeFetch('predicted-funding-rate'),
      coinalyzeFetch('liquidation-history', {
        interval: '1hour',
        from: String(oneDayAgo),
        to: String(now - 1),
      }),
      coinalyzeFetch('long-short-ratio-history', {
        interval: '1hour',
        from: String(oneDayAgo),
        to: String(now),
      }),
    ]);

    const freshQuote = (quote: { update?: number } | undefined) => quote?.update != null &&
      quote.update <= Date.now() / 1000 && Date.now() / 1000 - quote.update <= 3600;

    // Open Interest: current value + 24h change
    let oiValue: number | null = null;
    let oiChange: number | null = null;

    if (freshQuote(oiCurrent?.[0])) {
      const raw = oiCurrent[0].value ?? oiCurrent[0].c ?? null;
      oiValue = Number.isFinite(raw) && raw >= 0 ? raw : null;
    }
    if (oiHistory?.[0]?.history?.length === 24 &&
        oiHistory[0].history.every((e: { t: number; o: number; c: number }, i: number) =>
          e.t === oneDayAgo + i * 3600 && Number.isFinite(e.o) && Number.isFinite(e.c))) {
      const h = oiHistory[0].history;
      const latest = h[h.length - 1].c;
      const prev = h[0].o;
      if (latest >= 0 && prev > 0) {
        oiChange = ((latest - prev) / prev) * 100;
      }
    }

    // Funding Rate: current + predicted
    let fundingValue: number | null = null;
    let fundingPred: number | null = null;

    if (freshQuote(fundingCurrent?.[0])) {
      fundingValue = fundingCurrent[0].value ?? fundingCurrent[0].c ?? null;
      if (!Number.isFinite(fundingValue)) fundingValue = null;
    }
    if (freshQuote(fundingPredicted?.[0])) {
      fundingPred = fundingPredicted[0].value ?? fundingPredicted[0].c ?? null;
      if (!Number.isFinite(fundingPred)) fundingPred = null;
    }

    // Liquidations: sum last 24h long + short
    let liqLong: number | null = null;
    let liqShort: number | null = null;

    if (liqHistory?.[0]?.history?.length > 0) {
      const entries = liqHistory[0].history as Array<{ t: number; l: number; s: number }>;
      const complete = entries.length === 24 && entries.every((e, i) => e.t === oneDayAgo + i * 3600 &&
        Number.isFinite(e.l) && e.l >= 0 && Number.isFinite(e.s) && e.s >= 0);
      if (complete) {
        liqLong = entries.reduce((sum, e) => sum + e.l, 0);
        liqShort = entries.reduce((sum, e) => sum + e.s, 0);
      }
    }

    // Long/Short Ratio: latest
    let lsRatio: number | null = null;
    let longPct: number | null = null;
    let shortPct: number | null = null;

    if (lsHistory?.[0]?.history?.length > 0) {
      const latest = lsHistory[0].history[lsHistory[0].history.length - 1];
      if (latest.t >= now - 3600 && latest.t <= Date.now() / 1000) {
        lsRatio = Number.isFinite(latest.r) ? latest.r : null;
        longPct = Number.isFinite(latest.l) ? latest.l : null;
        shortPct = Number.isFinite(latest.s) ? latest.s : null;
      }
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
      periodEnd: new Date(now * 1000).toISOString(),
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
