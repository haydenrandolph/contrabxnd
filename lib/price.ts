// Canonical Bitcoin price fetch, shared by the public /api/price proxy and any
// server code that needs an authoritative price (e.g. alert checking). Keeping
// this in one place means clients never get to dictate "the current price".

export interface BitcoinPrice {
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
}

export interface BitcoinPriceResult {
  data: BitcoinPrice;
  cached: boolean;
  stale?: boolean;
  updatedAt: string;
}

// Cache for 30 seconds to stay under CoinGecko rate limits. Module-scoped, so
// this is best-effort per server instance — combined with the `next.revalidate`
// hint below it's plenty for this use case.
let cachedPrice: BitcoinPrice | null = null;
let lastFetch = 0;
let sourceUpdatedAt = 0;
const CACHE_DURATION = 30 * 1000;
const MAX_STALE_MS = 5 * 60 * 1000;

const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true&include_last_updated_at=true';

export async function getBitcoinPrice(): Promise<BitcoinPriceResult | null> {
  const now = Date.now();

  if (cachedPrice && now - lastFetch < CACHE_DURATION && now - sourceUpdatedAt <= 2 * 60 * 1000) {
    return { data: cachedPrice, cached: true, updatedAt: new Date(sourceUpdatedAt).toISOString() };
  }

  try {
    const response = await fetch(COINGECKO_URL, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    const updatedAt = Number(data.bitcoin?.last_updated_at) * 1000;
    if (data.bitcoin && Number.isFinite(data.bitcoin.usd) && data.bitcoin.usd > 0 &&
        Number.isFinite(updatedAt) && updatedAt <= now && now - updatedAt <= 2 * 60 * 1000) {
      cachedPrice = {
        price: data.bitcoin.usd,
        change24h: data.bitcoin.usd_24h_change ?? 0,
        marketCap: data.bitcoin.usd_market_cap ?? 0,
        volume24h: data.bitcoin.usd_24h_vol ?? 0,
      };
      lastFetch = now;
      sourceUpdatedAt = updatedAt;
      return { data: cachedPrice, cached: false, updatedAt: new Date(sourceUpdatedAt).toISOString() };
    }

    throw new Error('Invalid CoinGecko response');
  } catch (error) {
    console.error('CoinGecko fetch error:', error);

    // Fall back to stale cache if we have one.
    if (cachedPrice && now - sourceUpdatedAt <= MAX_STALE_MS) {
      return { data: cachedPrice, cached: true, stale: true, updatedAt: new Date(sourceUpdatedAt).toISOString() };
    }

    return null;
  }
}
