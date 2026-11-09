import { NextResponse } from 'next/server';
import { cronGuard } from '@/lib/audit-guards';
import { createAdminClient } from '@/lib/supabase/server';
import { scrapePolymarket } from '@/lib/polymarket/scraper';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  const denied = cronGuard(request);
  if (denied) return denied;

  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const snapshots = await scrapePolymarket();

    if (snapshots.length === 0) {
      return NextResponse.json({ stored: 0, message: 'No Bitcoin markets found' });
    }

    const { error } = await supabase
      .from('polymarket_snapshots')
      .upsert(snapshots, { onConflict: 'date,market_id' });

    if (error) {
      return NextResponse.json(
        { error: 'Polymarket snapshot write failed' },
        { status: 503 },
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
  } catch {
    return NextResponse.json({ error: 'Polymarket ingestion failed' }, { status: 503 });
  }
}
