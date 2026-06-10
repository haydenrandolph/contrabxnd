export interface HistoricalPrice {
  timestamp: number;
  price: number;
}

interface CacheEntry {
  data: HistoricalPrice[];
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function cacheKey(from: number, to: number): string {
  const fromDay = Math.floor(from / 86400);
  const toDay = Math.floor(to / 86400);
  return `${fromDay}-${toDay}`;
}

export async function getHistoricalPrices(
  from: number,
  to: number,
): Promise<HistoricalPrice[]> {
  const key = cacheKey(from, to);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.data;
  }

  const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${from}&to=${to}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });

  if (!res.ok) {
    if (cached) return cached.data;
    throw new Error(`CoinGecko returned ${res.status}`);
  }

  const json = await res.json();
  const prices: HistoricalPrice[] = (json.prices ?? []).map(
    ([ts, price]: [number, number]) => ({ timestamp: ts, price }),
  );

  cache.set(key, { data: prices, fetchedAt: Date.now() });
  return prices;
}
