import type { MeetingForecast } from './types';
import { FOMC_DATES } from './calendar';

/** Reject malformed forecasts and persisted rows using the old monthly-rate basis. */
export function validMeetingForecast(meeting: MeetingForecast): boolean {
  if (!meeting || !FOMC_DATES.includes(meeting.meeting_date) || !Array.isArray(meeting.probabilities) ||
      !meeting.probabilities.length || !Number.isFinite(meeting.implied_rate) ||
      !Number.isFinite(meeting.current_rate_bps) || meeting.current_rate_upper_bps !== meeting.current_rate_bps + 25) return false;
  let total = 0;
  let midpoint = 0;
  const classified = [0, 0, 0];
  for (const p of meeting.probabilities) {
    if (!Number.isFinite(p.lower_bps) || p.lower_bps % 25 !== 0 || p.upper_bps !== p.lower_bps + 25 ||
        !Number.isFinite(p.probability) || p.probability < 0 || p.probability > 1) return false;
    total += p.probability;
    midpoint += (p.lower_bps + 12.5) / 100 * p.probability;
    classified[p.lower_bps < meeting.current_rate_bps ? 0 : p.lower_bps === meeting.current_rate_bps ? 1 : 2] += p.probability;
  }
  return Math.abs(total - 1) < 0.0003 && Math.abs(midpoint - meeting.implied_rate) < 0.011 &&
    [meeting.cut_probability, meeting.hold_probability, meeting.hike_probability]
      .every((p, i) => Number.isFinite(p) && Math.abs(p - classified[i]) < 0.0003);
}
