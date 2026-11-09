import { NextRequest, NextResponse } from 'next/server';
import { interpolateDailyPrices } from '@/lib/btc-prices';
import { validHistoryRange } from '@/lib/audit-guards';
import { getHistoricalPrices } from '@/lib/bitcoin-history';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const from = Number(searchParams.get('from'));
  const to = Number(searchParams.get('to'));

  if (!validHistoryRange(from, to)) {
    return NextResponse.json(
      { error: 'from/to must be ordered integer Unix seconds from 2009-01-03 through now, spanning at most 20 years' },
      { status: 400 },
    );
  }

  const fromDate = new Date(from * 1000).toISOString().slice(0, 10);
  const toDate = new Date(to * 1000).toISOString().slice(0, 10);

  // For ranges within the last 365 days, try CoinGecko for daily granularity
  const now = Math.floor(Date.now() / 1000);
  const oneYearAgo = now - 365 * 86400;

  if (from >= oneYearAgo) {
    try {
      const prices = await getHistoricalPrices(from, Math.min(to, now));
      if (prices.length > 0) {
        return NextResponse.json({ prices });
      }
    } catch {
      // fall through to static data
    }
  }

  // Use static interpolated dataset for older/longer ranges
  const daily = interpolateDailyPrices(fromDate, toDate);
  const prices = daily.map((p) => ({
    timestamp: new Date(p.date + 'T00:00:00Z').getTime(),
    price: p.price,
  }));

  return NextResponse.json({ prices });
}
