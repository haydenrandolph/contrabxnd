import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { scrapeFedWatch } from '@/lib/fedwatch/scraper';

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
      console.error('Failed to store FedWatch snapshot:', error);
      return NextResponse.json(
        { error: `DB error: ${error.message}`, snapshot },
        { status: 500 },
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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('FedWatch scrape failed:', err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
