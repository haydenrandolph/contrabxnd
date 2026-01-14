import { NextResponse } from 'next/server';

// Cache price data for 30 seconds to avoid rate limits
let cachedPrice: {
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
} | null = null;
let lastFetch = 0;
const CACHE_DURATION = 30 * 1000; // 30 seconds

export async function GET() {
  const now = Date.now();

  // Return cached data if still fresh
  if (cachedPrice && now - lastFetch < CACHE_DURATION) {
    return NextResponse.json({ ...cachedPrice, cached: true });
  }

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true',
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 30 },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.bitcoin) {
      cachedPrice = {
        price: data.bitcoin.usd,
        change24h: data.bitcoin.usd_24h_change,
        marketCap: data.bitcoin.usd_market_cap,
        volume24h: data.bitcoin.usd_24h_vol,
      };
      lastFetch = now;

      return NextResponse.json({ ...cachedPrice, cached: false });
    }

    throw new Error('Invalid CoinGecko response');
  } catch (error) {
    console.error('CoinGecko fetch error:', error);

    // Return stale cache if available
    if (cachedPrice) {
      return NextResponse.json({ ...cachedPrice, cached: true, stale: true });
    }

    return NextResponse.json(
      { error: 'Failed to fetch price data' },
      { status: 500 }
    );
  }
}
