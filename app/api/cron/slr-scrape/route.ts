import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { scrapeSlr } from '@/lib/slr/scraper';

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
    const snapshot = await scrapeSlr();

    const { error } = await supabase.from('slr_snapshots').upsert(
      {
        date: snapshot.date,
        leverage_subindex: snapshot.leverage_subindex,
        tier1_leverage_capital: snapshot.tier1_leverage_capital,
        policy_signal: snapshot.policy_signal,
        policy_event: snapshot.policy_event,
        source: snapshot.source,
        raw_data: snapshot.raw_data,
      },
      { onConflict: 'date' },
    );

    if (error) {
      console.error('Failed to store SLR snapshot:', error);
      return NextResponse.json(
        { error: `DB error: ${error.message}`, snapshot },
        { status: 500 },
      );
    }

    return NextResponse.json({
      status: 'stored',
      date: snapshot.date,
      leverage_subindex: snapshot.leverage_subindex,
      tier1_leverage_capital: snapshot.tier1_leverage_capital,
      policy_signal: snapshot.policy_signal,
      policy_event: snapshot.policy_event,
      source: snapshot.source,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('SLR scrape failed:', err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
