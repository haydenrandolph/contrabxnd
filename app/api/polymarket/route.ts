import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { currentBullishMarkets } from '@/lib/polymarket/math';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ markets: [], avg_bull_prob: null }, { status: 500 });
  }

  const { data: rows } = await supabase
    .from('polymarket_snapshots')
    .select('date, market_id, question, slug, outcome_yes, outcome_no, volume, liquidity, active, raw_data')
    .order('date', { ascending: false })
    .limit(200);

  if (!rows?.length) {
    return NextResponse.json({ markets: [], avg_bull_prob: null });
  }

  const current = currentBullishMarkets(rows);
  const markets = current.map(r => ({
      question: r.question,
      slug: r.slug,
      yes: r.outcome_yes,
      volume: r.volume,
      liquidity: r.liquidity,
    }));

  let totalVol = 0;
  let weightedYes = 0;
  for (const m of markets) {
    totalVol += m.volume;
    weightedYes += m.yes * m.volume;
  }

  const avgBullProb = totalVol > 0 ? weightedYes / totalVol : null;

  return NextResponse.json({
    markets: markets.sort((a, b) => b.volume - a.volume),
    avg_bull_prob: avgBullProb,
    count: markets.length,
    date: current[0]?.date ?? null,
  });
}
