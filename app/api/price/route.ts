import { NextResponse } from 'next/server';
import { getBitcoinPrice } from '@/lib/price';

export async function GET() {
  const result = await getBitcoinPrice();

  if (!result) {
    return NextResponse.json({ error: 'Failed to fetch price data' }, { status: 500 });
  }

  return NextResponse.json({ ...result.data, cached: result.cached, stale: result.stale });
}
