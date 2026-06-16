import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { MeetingForecast } from '@/lib/fedwatch/types';

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

    if (error || !row) {
      return NextResponse.json(UNAVAILABLE);
    }

    const meetings = (row.meetings ?? []) as MeetingForecast[];
    const first = meetings[0] ?? null;

    const next_meeting = first
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
    if (cache) return NextResponse.json(cache.data);
    return NextResponse.json(UNAVAILABLE, { status: 500 });
  }
}
