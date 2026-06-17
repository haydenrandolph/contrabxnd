import { NextRequest, NextResponse } from 'next/server';
import { fetchCandles, type ChartInterval } from '@/lib/chart/candles';

const VALID_INTERVALS: ChartInterval[] = ['1m', '15m', '1h', '4h', '1d', '1w'];

export async function GET(req: NextRequest) {
  const interval = req.nextUrl.searchParams.get('interval') as ChartInterval | null;

  if (interval && !VALID_INTERVALS.includes(interval)) {
    return NextResponse.json({ error: 'Invalid interval' }, { status: 400 });
  }

  try {
    const candles = await fetchCandles(interval ?? '1d');
    return NextResponse.json({ candles });
  } catch (error) {
    console.error('Chart API error:', error);
    return NextResponse.json({ error: 'Failed to fetch candles' }, { status: 502 });
  }
}
