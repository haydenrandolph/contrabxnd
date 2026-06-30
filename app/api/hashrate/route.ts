import { NextResponse } from 'next/server';
import { getMiningIntelligence } from '@/lib/hashrate';

export const dynamic = 'force-dynamic';

let cache: { data: unknown; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000; // difficulty/hashrate move slowly

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(cache.data);
  }
  try {
    const data = await getMiningIntelligence();
    cache = { data, fetchedAt: Date.now() };
    return NextResponse.json(data);
  } catch (err) {
    console.error('Hashrate API error:', err);
    if (cache) return NextResponse.json(cache.data);
    return NextResponse.json({ error: 'Could not compute mining intelligence' }, { status: 502 });
  }
}
