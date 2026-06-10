import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalPrices } from '@/lib/bitcoin-history';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const from = Number(searchParams.get('from'));
  const to = Number(searchParams.get('to'));

  if (!from || !to || from >= to) {
    return NextResponse.json(
      { error: 'Invalid from/to timestamps' },
      { status: 400 },
    );
  }

  const earliest = 1367107200; // 2013-04-28
  const now = Math.floor(Date.now() / 1000);
  const clampedFrom = Math.max(from, earliest);
  const clampedTo = Math.min(to, now);

  try {
    const prices = await getHistoricalPrices(clampedFrom, clampedTo);
    return NextResponse.json({ prices });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 502 },
    );
  }
}
