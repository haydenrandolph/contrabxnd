import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { scrapePolymarket } from '@/lib/polymarket/scraper';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const snapshots = await scrapePolymarket();

    if (snapshots.length === 0) {
      return NextResponse.json({ stored: 0, message: 'No Bitcoin markets found' });
    }

    const { error } = await supabase
      .from('polymarket_snapshots')
      .upsert(snapshots, { onConflict: 'date,market_id' });

    if (error) {
      console.error('Failed to store polymarket snapshots:', error);
      return NextResponse.json(
        { error: `DB error: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      stored: snapshots.length,
      markets: snapshots.map(s => ({
        question: s.question,
        yes: s.outcome_yes,
        volume: s.volume,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Polymarket scrape failed:', err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
