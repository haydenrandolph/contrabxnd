import { NextResponse } from 'next/server';
import { cronGuard } from '@/lib/audit-guards';
import { createAdminClient } from '@/lib/supabase/server';
import { scrapeSlr } from '@/lib/slr/scraper';

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
      return NextResponse.json(
        { error: 'SLR snapshot write failed' },
        { status: 503 },
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
  } catch {
    return NextResponse.json({ error: 'SLR ingestion failed' }, { status: 503 });
  }
}
