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
}

// Cache for 30 seconds to stay under CoinGecko rate limits. Module-scoped, so
// this is best-effort per server instance — combined with the `next.revalidate`
// hint below it's plenty for this use case.
let cachedPrice: BitcoinPrice | null = null;
let lastFetch = 0;
const CACHE_DURATION = 30 * 1000;

const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true';

export async function getBitcoinPrice(): Promise<BitcoinPriceResult | null> {
  const now = Date.now();

  if (cachedPrice && now - lastFetch < CACHE_DURATION) {
    return { data: cachedPrice, cached: true };
  }

  try {
    const response = await fetch(COINGECKO_URL, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.bitcoin && typeof data.bitcoin.usd === 'number') {
      cachedPrice = {
        price: data.bitcoin.usd,
        change24h: data.bitcoin.usd_24h_change,
        marketCap: data.bitcoin.usd_market_cap,
        volume24h: data.bitcoin.usd_24h_vol,
      };
      lastFetch = now;
      return { data: cachedPrice, cached: false };
    }

    throw new Error('Invalid CoinGecko response');
  } catch (error) {
    console.error('CoinGecko fetch error:', error);

    // Fall back to stale cache if we have one.
    if (cachedPrice) {
      return { data: cachedPrice, cached: true, stale: true };
    }

    return null;
  }
}
