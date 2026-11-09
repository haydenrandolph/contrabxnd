import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { MeetingForecast } from '@/lib/fedwatch/types';
import { isFreshDate } from '@/lib/etf/math';
import { validMeetingForecast } from '@/lib/fedwatch/math';
import { FOMC_DATES } from '@/lib/fedwatch/calendar';

export const dynamic = 'force-dynamic';

let cache: { data: Record<string, unknown>; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const UNAVAILABLE = {
  date: null,
  current_rate: null,
  target_lower: null,
  target_upper: null,
  meetings: [],
  next_meeting: null,
};

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(cache.data);
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(UNAVAILABLE);
  }

  try {
    const { data: row, error } = await supabase
      .from('fedwatch_snapshots')
      .select('date, current_rate, target_lower, target_upper, meetings')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error || !row || !isFreshDate(row.date, 4)) {
      return NextResponse.json(UNAVAILABLE);
    }

    const today = new Date().toISOString().slice(0, 10);
    const meetings = ((row.meetings ?? []) as MeetingForecast[])
      .filter(m => m.meeting_date > today && validMeetingForecast(m)).sort((a, b) => a.meeting_date.localeCompare(b.meeting_date));
    const first = meetings[0] ?? null;

    const next_meeting = first && first.meeting_date === FOMC_DATES.find(d => d > today)
      ? {
          date: first.meeting_date,
          cut: first.cut_probability,
          hold: first.hold_probability,
          hike: first.hike_probability,
        }
      : null;

    const result = {
      date: row.date,
      current_rate: row.current_rate,
      target_lower: row.target_lower,
      target_upper: row.target_upper,
      meetings,
      next_meeting,
    };

    cache = { data: result, fetchedAt: Date.now() };
    return NextResponse.json(result);
  } catch (err) {
    console.error('FedWatch API error:', err);
    return NextResponse.json(UNAVAILABLE, { status: 500 });
  }
}
