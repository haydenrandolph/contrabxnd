import { NextResponse } from 'next/server';
import { authenticateApiKey, apiResponse } from '@/lib/api-auth';

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth.ok) return auth.response;

  try {
    const origin = new URL(req.url).origin;
    const res = await fetch(`${origin}/api/liquidity`);
    if (!res.ok) return NextResponse.json({ error: 'Liquidity data unavailable' }, { status: 502 });

    const data = await res.json();
    return apiResponse({
      date: data.date ?? null,
      netLiquidity: data.net_liquidity ?? null,
      momentum13w: data.momentum_13w ?? null,
      tgaTrend: data.tga_trend ?? null,
      rrpTrend: data.rrp_trend ?? null,
    }, auth);
  } catch {
    return NextResponse.json({ error: 'Liquidity data unavailable' }, { status: 502 });
  }
}
