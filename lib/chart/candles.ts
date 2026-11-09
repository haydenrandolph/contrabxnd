export interface OHLCCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type ChartInterval = '1m' | '15m' | '1h' | '4h' | '1d' | '1w';

// Coinbase supported granularities: 60, 300, 900, 3600, 21600, 86400
const GRANULARITY: Record<ChartInterval, number> = {
  '1m': 60,
  '15m': 900,
  '1h': 3600,
  '4h': 3600,   // fetch hourly, aggregate to actual UTC 4h candles
  '1d': 86400,
  '1w': 86400,  // fetch daily, aggregate to weekly
};

const CANDLE_COUNT: Record<ChartInterval, number> = {
  '1m': 300,     // 5 hours
  '15m': 192,    // 2 days
  '1h': 168,     // 7 days
  '4h': 180,     // 30 days of 4h candles
  '1d': 365,     // 1 year
  '1w': 730,     // fetch 2 years of daily to build ~104 weekly
};

const MAX_PER_REQUEST = 300;

function parseCandles(data: number[][]): OHLCCandle[] {
  return data.map((k) => ({
    time: k[0],
    open: k[3],
    high: k[2],
    low: k[1],
    close: k[4],
    volume: k[5],
  }));
}

/** Shared with live chart consumers; timestamps are Unix seconds. */
export function candleBucket(time: number, interval: ChartInterval): number {
  if (interval !== '1w') {
    const seconds = interval === '4h' ? 14400 : GRANULARITY[interval];
    return Math.floor(time / seconds) * seconds;
  }
  // Unix epoch was Thursday; anchor weekly buckets to Monday 00:00 UTC.
  return Math.floor((time - 345600) / 604800) * 604800 + 345600;
}

export function aggregateCandles(daily: OHLCCandle[], interval: '4h' | '1w'): OHLCCandle[] {
  const weeks: Map<number, OHLCCandle> = new Map();

  for (const c of [...daily].sort((a, b) => a.time - b.time)) {
    const weekKey = candleBucket(c.time, interval);

    const existing = weeks.get(weekKey);
    if (!existing) {
      weeks.set(weekKey, { ...c, time: weekKey });
    } else {
      existing.high = Math.max(existing.high, c.high);
      existing.low = Math.min(existing.low, c.low);
      existing.close = c.close;
      existing.volume += c.volume;
    }
  }

  return Array.from(weeks.values()).sort((a, b) => a.time - b.time);
}

async function fetchPage(
  granularity: number,
  start: Date,
  end: Date,
  revalidate: number,
): Promise<OHLCCandle[]> {
  const url = `https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=${granularity}&start=${start.toISOString()}&end=${end.toISOString()}`;

  const res = await fetch(url, {
    next: { revalidate },
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`Coinbase API error: ${res.status}`);

  return parseCandles(await res.json());
}

export async function fetchCandles(
  interval: ChartInterval = '1d',
  limit?: number,
): Promise<OHLCCandle[]> {
  const requested = limit ?? CANDLE_COUNT[interval];
  if (!Number.isInteger(requested) || requested < 1 || requested > 5000) throw new Error('Invalid candle limit');
  const count = interval === '4h' ? requested * 4 + 3 : interval === '1w' && limit ? requested * 7 + 6 : requested;
  const granularity = GRANULARITY[interval];
  const revalidate = interval === '1m' ? 15 : interval === '15m' ? 30 : interval === '1h' ? 60 : 300;
  // Anchor URLs to source candle boundaries; revalidation updates the live bar
  // without creating a new cache entry on every request or refresh period.
  const end = new Date((Math.floor(Date.now() / (granularity * 1000)) + 1) * granularity * 1000);
  const start = new Date(end.getTime() - count * granularity * 1000);

  let allCandles: OHLCCandle[];

  if (count <= MAX_PER_REQUEST) {
    allCandles = await fetchPage(granularity, start, end, revalidate);
  } else {
    const pages: Promise<OHLCCandle[]>[] = [];
    let pageEnd = end;
    let remaining = count;

    while (remaining > 0) {
      const pageCount = Math.min(remaining, MAX_PER_REQUEST);
      const pageStart = new Date(pageEnd.getTime() - pageCount * granularity * 1000);
      pages.push(fetchPage(granularity, pageStart, pageEnd, revalidate));
      pageEnd = pageStart;
      remaining -= pageCount;
    }

    const results = await Promise.all(pages);
    allCandles = results.flat();
  }

  // Deduplicate
  const seen = new Set<number>();
  const deduped = allCandles.filter((c) => {
    if (seen.has(c.time)) return false;
    seen.add(c.time);
    return true;
  });

  const sorted = deduped.filter(c => c.time >= start.getTime() / 1000 && c.time < end.getTime() / 1000)
    .sort((a, b) => a.time - b.time);

  if (interval === '1w' || interval === '4h') {
    const aggregated = aggregateCandles(sorted, interval);
    return limit || interval === '4h' ? aggregated.slice(-requested) : aggregated;
  }

  return sorted.slice(-requested);
}
