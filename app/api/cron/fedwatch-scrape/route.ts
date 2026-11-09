import { NextResponse } from 'next/server';
import { cronGuard } from '@/lib/audit-guards';
import { createAdminClient } from '@/lib/supabase/server';
import { scrapeFedWatch } from '@/lib/fedwatch/scraper';

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

    const snapshot = await scrapeFedWatch();

    const { error } = await supabase.from('fedwatch_snapshots').upsert(
      {
        date: snapshot.date,
        current_rate: snapshot.current_rate,
        target_lower: snapshot.target_lower,
        target_upper: snapshot.target_upper,
        meetings: snapshot.meetings,
        sources: snapshot.sources,
      },
      { onConflict: 'date' },
    );

    if (error) {
      return NextResponse.json(
        { error: 'FedWatch snapshot write failed' },
        { status: 503 },
      );
    }

    return NextResponse.json({
      status: 'stored',
      date: snapshot.date,
      current_rate: `${snapshot.target_lower}%-${snapshot.target_upper}%`,
      meetings_count: snapshot.meetings.length,
      next_meeting: snapshot.meetings[0]?.meeting_date ?? null,
      sources: snapshot.sources,
    });
  } catch {
    return NextResponse.json({ error: 'FedWatch ingestion failed' }, { status: 503 });
  }
}
