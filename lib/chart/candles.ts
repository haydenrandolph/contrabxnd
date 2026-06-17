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
  '4h': 21600,  // 6h — closest supported
  '1d': 86400,
  '1w': 86400,  // fetch daily, aggregate to weekly
};

const CANDLE_COUNT: Record<ChartInterval, number> = {
  '1m': 300,     // 5 hours
  '15m': 192,    // 2 days
  '1h': 168,     // 7 days
  '4h': 120,     // 30 days of 6h candles
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

function aggregateWeekly(daily: OHLCCandle[]): OHLCCandle[] {
  const weeks: Map<number, OHLCCandle> = new Map();

  for (const c of daily) {
    const d = new Date(c.time * 1000);
    const day = d.getUTCDay();
    const mondayOffset = day === 0 ? 6 : day - 1;
    const monday = new Date(d);
    monday.setUTCDate(monday.getUTCDate() - mondayOffset);
    monday.setUTCHours(0, 0, 0, 0);
    const weekKey = Math.floor(monday.getTime() / 1000);

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
  const count = limit ?? CANDLE_COUNT[interval];
  const granularity = GRANULARITY[interval];
  const revalidate = interval === '1m' ? 15 : interval === '15m' ? 30 : interval === '1h' ? 60 : 300;
  const end = new Date();
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

  const sorted = deduped.sort((a, b) => a.time - b.time);

  if (interval === '1w') {
    return aggregateWeekly(sorted);
  }

  return sorted;
}
