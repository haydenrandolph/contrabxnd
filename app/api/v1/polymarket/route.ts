import { NextResponse } from 'next/server';
import { authenticateApiKey, apiResponse } from '@/lib/api-auth';

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth.ok) return auth.response;

  try {
    const origin = new URL(req.url).origin;
    const res = await fetch(`${origin}/api/polymarket`);
    if (!res.ok) return NextResponse.json({ error: 'Polymarket data unavailable' }, { status: 502 });

    const data = await res.json();
    return apiResponse({
      markets: data.markets ?? [],
      avgBullProb: data.avg_bull_prob ?? null,
      count: data.count ?? 0,
    }, auth);
  } catch {
    return NextResponse.json({ error: 'Polymarket data unavailable' }, { status: 502 });
  }
}
