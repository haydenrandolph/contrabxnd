import type { FedWatchSnapshot, MeetingForecast, RateProbability } from './types';

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

// ---------------------------------------------------------------------------
// 1. FOMC meeting dates (update annually — sourced from federalreserve.gov)
//    These are the *second day* (decision day) of each two-day FOMC meeting.
// ---------------------------------------------------------------------------

const FOMC_DATES_2025 = [
  '2025-01-29',
  '2025-03-19',
  '2025-05-07',
  '2025-06-18',
  '2025-07-30',
  '2025-09-17',
  '2025-10-29',
  '2025-12-17',
];

const FOMC_DATES_2026 = [
  '2026-01-28',
  '2026-03-18',
  '2026-04-29',
  '2026-06-17',
  '2026-07-29',
  '2026-09-16',
  '2026-10-28',
  '2026-12-16',
];

const ALL_FOMC_DATES = [...FOMC_DATES_2025, ...FOMC_DATES_2026];

// ---------------------------------------------------------------------------
// 2. ZQ futures contract month codes
// ---------------------------------------------------------------------------

const MONTH_CODES: Record<number, string> = {
  1: 'F', 2: 'G', 3: 'H', 4: 'J', 5: 'K', 6: 'M',
  7: 'N', 8: 'Q', 9: 'U', 10: 'V', 11: 'X', 12: 'Z',
};

/**
 * Build the Barchart symbol for a ZQ contract.
 * Format: ZQ{MonthCode}{2-digit year}
 * Example: ZQN26 = July 2026
 */
function zqSymbol(year: number, month: number): string {
  const code = MONTH_CODES[month];
  const yy = String(year).slice(-2);
  return `ZQ${code}${yy}`;
}

// ---------------------------------------------------------------------------
// 3. Fetch current fed funds target rate from FRED
// ---------------------------------------------------------------------------

async function fetchCurrentRate(): Promise<{
  lower: number;
  upper: number;
  midpoint: number;
}> {
  const fredKey = process.env.FRED_API_KEY;

  if (fredKey) {
    // Use FRED API for authoritative data
    const [upperRes, lowerRes] = await Promise.all([
      fetch(
        `https://api.stlouisfed.org/fred/series/observations?series_id=DFEDTARU&sort_order=desc&limit=1&file_type=json&api_key=${fredKey}`,
        { cache: 'no-store' },
      ),
      fetch(
        `https://api.stlouisfed.org/fred/series/observations?series_id=DFEDTARL&sort_order=desc&limit=1&file_type=json&api_key=${fredKey}`,
        { cache: 'no-store' },
      ),
    ]);

    if (upperRes.ok && lowerRes.ok) {
      const upperData = await upperRes.json();
      const lowerData = await lowerRes.json();
      const upper = parseFloat(upperData.observations?.[0]?.value);
      const lower = parseFloat(lowerData.observations?.[0]?.value);

      if (!isNaN(upper) && !isNaN(lower)) {
        return { lower, upper, midpoint: (lower + upper) / 2 };
      }
    }
  }

  // Fallback: scrape the NY Fed EFFR page
  const effRes = await fetch(
    'https://markets.newyorkfed.org/api/rates/effr/last/1.json',
    { headers: { 'User-Agent': BROWSER_UA }, cache: 'no-store' },
  );

  if (effRes.ok) {
    const effData = await effRes.json();
    const rate = effData?.refRates?.[0];
    if (rate) {
      const targetUpper = parseFloat(rate.targetRateUpper ?? rate.targetRateTo);
      const targetLower = parseFloat(rate.targetRateLower ?? rate.targetRateFrom);
      if (!isNaN(targetUpper) && !isNaN(targetLower)) {
        return {
          lower: targetLower,
          upper: targetUpper,
          midpoint: (targetLower + targetUpper) / 2,
        };
      }
    }
  }

  throw new Error('Could not fetch current fed funds rate from any source');
}

// ---------------------------------------------------------------------------
// 4. Fetch ZQ futures prices from Barchart OnDemand
// ---------------------------------------------------------------------------

interface FuturesPrice {
  symbol: string;
  year: number;
  month: number;
  price: number;
  impliedRate: number;
}

async function fetchFuturesPrices(
  months: Array<{ year: number; month: number }>,
): Promise<Map<string, FuturesPrice>> {
  const results = new Map<string, FuturesPrice>();
  const apiKey = process.env.BARCHART_API_KEY;

  if (!apiKey) {
    console.warn('BARCHART_API_KEY not set — cannot fetch ZQ futures');
    return results;
  }

  // Build symbol list and a lookup map
  const symbolMap = new Map<string, { year: number; month: number; key: string }>();
  for (const { year, month } of months) {
    const sym = zqSymbol(year, month);
    const key = `${year}-${String(month).padStart(2, '0')}`;
    symbolMap.set(sym, { year, month, key });
  }

  const symbols = Array.from(symbolMap.keys()).join(',');

  try {
    const url = `https://ondemand.websol.barchart.com/getQuote.json?apikey=${apiKey}&symbols=${symbols}&fields=lastPrice,previousClose,settlement`;
    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      console.warn(`Barchart API: HTTP ${res.status}`);
      return results;
    }

    const data = await res.json();

    if (data.status?.code !== 200 || !Array.isArray(data.results)) {
      console.warn('Barchart API unexpected response:', data.status);
      return results;
    }

    for (const quote of data.results) {
      const sym = quote.symbol;
      const meta = symbolMap.get(sym);
      if (!meta) continue;

      // Prefer settlement price (EOD), fall back to lastPrice, then previousClose
      const price = quote.settlement ?? quote.lastPrice ?? quote.previousClose ?? null;

      if (price && typeof price === 'number') {
        results.set(meta.key, {
          symbol: sym,
          year: meta.year,
          month: meta.month,
          price,
          impliedRate: 100 - price,
        });
      }
    }
  } catch (err) {
    console.warn('Barchart fetch failed:', err);
  }

  return results;
}

// ---------------------------------------------------------------------------
// 5. CME FedWatch probability calculation
// ---------------------------------------------------------------------------

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function dayOfMonth(dateStr: string): number {
  return new Date(dateStr).getUTCDate();
}

/**
 * Calculate FedWatch-style probabilities for a single FOMC meeting.
 *
 * Uses the CME methodology:
 *   Implied monthly avg rate = 100 - futures price
 *   R_post = (totalDays * avgRate - daysBefore * R_pre) / daysAfter
 *   P(25bp move) = |R_post - R_pre| / 0.25
 */
function calculateMeetingProbabilities(
  meetingDate: string,
  startRate: number,
  meetingMonthRate: number,
  priorMonthRate: number | null,
): { endRate: number; probabilities: RateProbability[] } {
  const date = new Date(meetingDate);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const meetingDay = dayOfMonth(meetingDate);
  const totalDays = daysInMonth(year, month);

  // Days before the meeting (rate hasn't changed yet)
  const daysBefore = meetingDay - 1;
  // Days from the meeting through month-end (new rate in effect)
  const daysAfter = totalDays - daysBefore;

  // Determine the pre-meeting rate for this month
  let preMeetingRate: number;

  if (priorMonthRate !== null) {
    // If we have the prior month's futures-implied rate and the prior month
    // had no meeting, it directly gives us the start rate
    preMeetingRate = priorMonthRate;
  } else {
    // Use the start rate (current EFFR or computed end rate from prior meeting)
    preMeetingRate = startRate;
  }

  // Solve for post-meeting rate:
  // monthlyAvg = (daysBefore * preMeetingRate + daysAfter * postMeetingRate) / totalDays
  // postMeetingRate = (totalDays * monthlyAvg - daysBefore * preMeetingRate) / daysAfter
  const postMeetingRate =
    (totalDays * meetingMonthRate - daysBefore * preMeetingRate) / daysAfter;

  // Clamp to reasonable bounds
  const endRate = Math.max(0, postMeetingRate);

  // Calculate implied change in basis points
  const changeBps = Math.round((endRate - preMeetingRate) * 10000) / 100;

  // Determine which 25bp outcomes are implied
  const changeIn25bpUnits = changeBps / 25;
  const floorMoves = Math.floor(changeIn25bpUnits);
  const ceilMoves = floorMoves + (changeBps >= 0 ? 1 : -1);

  // Probability of the further move
  const fracPart = Math.abs(changeIn25bpUnits) - Math.abs(Math.trunc(changeIn25bpUnits));

  // Current rate in bps (lower bound of target range)
  const currentLowerBps = Math.round(preMeetingRate * 100);
  // Snap to nearest 25bp
  const snappedBps = Math.round(currentLowerBps / 25) * 25;

  // Build probabilities for the two bracketing outcomes
  const probabilities: RateProbability[] = [];

  if (Math.abs(changeBps) < 1) {
    // Essentially no change implied
    probabilities.push({
      lower_bps: snappedBps,
      upper_bps: snappedBps + 25,
      label: `${snappedBps}-${snappedBps + 25}`,
      probability: 1.0,
    });
  } else {
    const outcome1Bps = snappedBps + floorMoves * 25;
    const outcome2Bps = snappedBps + ceilMoves * 25;

    const p2 = Math.min(1, Math.max(0, fracPart));
    const p1 = 1 - p2;

    if (p1 > 0.001) {
      probabilities.push({
        lower_bps: outcome1Bps,
        upper_bps: outcome1Bps + 25,
        label: `${outcome1Bps}-${outcome1Bps + 25}`,
        probability: Math.round(p1 * 10000) / 10000,
      });
    }
    if (p2 > 0.001) {
      probabilities.push({
        lower_bps: outcome2Bps,
        upper_bps: outcome2Bps + 25,
        label: `${outcome2Bps}-${outcome2Bps + 25}`,
        probability: Math.round(p2 * 10000) / 10000,
      });
    }
  }

  // Sort by lower_bps descending (highest rate first, matching CME convention)
  probabilities.sort((a, b) => b.lower_bps - a.lower_bps);

  return { endRate, probabilities };
}

// ---------------------------------------------------------------------------
// 6. Main scraper: assemble the full FedWatch snapshot
// ---------------------------------------------------------------------------

export async function scrapeFedWatch(): Promise<FedWatchSnapshot> {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Get upcoming FOMC meetings (within the next ~12 months)
  const upcomingMeetings = ALL_FOMC_DATES.filter(d => d > todayStr).slice(0, 8);

  if (upcomingMeetings.length === 0) {
    throw new Error('No upcoming FOMC meetings found — update FOMC_DATES arrays');
  }

  // 1. Fetch current fed funds rate
  const currentRate = await fetchCurrentRate();

  // 2. Determine which contract months we need
  const neededMonths = new Set<string>();
  for (const meeting of upcomingMeetings) {
    const d = new Date(meeting);
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    neededMonths.add(ym);

    // Also need the prior month for Type 2 meetings
    const priorDate = new Date(d.getUTCFullYear(), d.getUTCMonth() - 1, 1);
    const priorYm = `${priorDate.getFullYear()}-${String(priorDate.getMonth() + 1).padStart(2, '0')}`;
    neededMonths.add(priorYm);
  }

  const monthsToFetch = Array.from(neededMonths).map(ym => {
    const [y, m] = ym.split('-').map(Number);
    return { year: y, month: m };
  });

  // 3. Fetch futures prices
  const prices = await fetchFuturesPrices(monthsToFetch);
  const sources: string[] = ['barchart'];

  if (process.env.FRED_API_KEY) {
    sources.push('fred');
  } else {
    sources.push('ny-fed');
  }

  // 4. Calculate probabilities for each meeting
  const meetings: MeetingForecast[] = [];
  let runningRate = currentRate.midpoint;

  for (const meetingDate of upcomingMeetings) {
    const d = new Date(meetingDate);
    const meetingYm = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

    // Prior month key
    const priorDate = new Date(d.getUTCFullYear(), d.getUTCMonth() - 1, 1);
    const priorYm = `${priorDate.getFullYear()}-${String(priorDate.getMonth() + 1).padStart(2, '0')}`;

    const meetingMonthFutures = prices.get(meetingYm);
    if (!meetingMonthFutures) {
      console.warn(`No futures data for ${meetingYm}, skipping ${meetingDate}`);
      continue;
    }

    // Check if prior month had an FOMC meeting (Type 1 vs Type 2)
    const priorMonthHadMeeting = upcomingMeetings.some(m => {
      const md = new Date(m);
      return (
        md.getUTCFullYear() === priorDate.getFullYear() &&
        md.getUTCMonth() === priorDate.getMonth() &&
        m < meetingDate
      );
    });

    let priorMonthRate: number | null = null;
    if (!priorMonthHadMeeting) {
      const priorFutures = prices.get(priorYm);
      if (priorFutures) {
        priorMonthRate = priorFutures.impliedRate;
      }
    }

    const { endRate, probabilities } = calculateMeetingProbabilities(
      meetingDate,
      runningRate,
      meetingMonthFutures.impliedRate,
      priorMonthRate,
    );

    // Classify probabilities
    const currentLowerBps = Math.round(currentRate.lower * 100);
    const snappedCurrentBps = Math.round(currentLowerBps / 25) * 25;

    let cutProb = 0;
    let holdProb = 0;
    let hikeProb = 0;

    for (const p of probabilities) {
      if (p.lower_bps < snappedCurrentBps) {
        cutProb += p.probability;
      } else if (p.lower_bps === snappedCurrentBps) {
        holdProb += p.probability;
      } else {
        hikeProb += p.probability;
      }
    }

    meetings.push({
      meeting_date: meetingDate,
      current_rate_bps: snappedCurrentBps,
      current_rate_upper_bps: snappedCurrentBps + 25,
      probabilities,
      implied_rate: Math.round(meetingMonthFutures.impliedRate * 10000) / 10000,
      cut_probability: Math.round(cutProb * 10000) / 10000,
      hold_probability: Math.round(holdProb * 10000) / 10000,
      hike_probability: Math.round(hikeProb * 10000) / 10000,
    });

    // Carry forward the end rate for the next meeting's start rate
    runningRate = endRate;
  }

  if (meetings.length === 0) {
    throw new Error('Could not calculate probabilities for any FOMC meeting');
  }

  return {
    date: todayStr,
    current_rate: currentRate.midpoint,
    target_lower: currentRate.lower,
    target_upper: currentRate.upper,
    meetings,
    sources,
  };
}
