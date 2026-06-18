import { NextResponse } from 'next/server';

interface CalendarEvent {
  date: string;
  type: 'fomc' | 'cpi' | 'pce' | 'jobs' | 'gdp' | 'options' | 'difficulty' | 'halving';
  title: string;
  detail: string;
  impact: number;
  impactLabel: string;
  daysUntil: number;
}

interface CacheEntry {
  data: CalendarEvent[];
  fetchedAt: number;
}

let cache: CacheEntry | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 min

// Historical average absolute BTC price move within 24h of event
const IMPACT: Record<string, { avg: number; label: string }> = {
  fomc:       { avg: 3.2, label: 'HIGH' },
  cpi:        { avg: 2.8, label: 'HIGH' },
  pce:        { avg: 1.9, label: 'MED' },
  jobs:       { avg: 2.1, label: 'MED' },
  gdp:        { avg: 1.4, label: 'LOW' },
  options:    { avg: 1.5, label: 'MED' },
  difficulty: { avg: 0.8, label: 'LOW' },
  halving:    { avg: 8.0, label: 'EXTREME' },
};

// FOMC decision dates (announcement day) — 2025-2026
const FOMC_DATES = [
  '2025-01-29', '2025-03-19', '2025-05-07', '2025-06-18',
  '2025-07-30', '2025-09-17', '2025-10-29', '2025-12-17',
  '2026-01-28', '2026-03-18', '2026-05-06', '2026-06-17',
  '2026-07-29', '2026-09-16', '2026-10-28', '2026-12-16',
];

// CPI release dates — 2025-2026
const CPI_DATES = [
  '2025-01-15', '2025-02-12', '2025-03-12', '2025-04-10',
  '2025-05-13', '2025-06-11', '2025-07-10', '2025-08-12',
  '2025-09-10', '2025-10-14', '2025-11-12', '2025-12-10',
  '2026-01-14', '2026-02-11', '2026-03-11', '2026-04-14',
  '2026-05-12', '2026-06-10', '2026-07-14', '2026-08-12',
  '2026-09-10', '2026-10-13', '2026-11-10', '2026-12-09',
];

// PCE release dates (typically last Friday of month, ~4 weeks after CPI)
const PCE_DATES = [
  '2025-01-31', '2025-02-28', '2025-03-28', '2025-04-30',
  '2025-05-30', '2025-06-27', '2025-07-31', '2025-08-29',
  '2025-09-26', '2025-10-31', '2025-11-26', '2025-12-23',
  '2026-01-30', '2026-02-27', '2026-03-27', '2026-04-30',
  '2026-05-29', '2026-06-26', '2026-07-31', '2026-08-28',
  '2026-09-25', '2026-10-30', '2026-11-25', '2026-12-23',
];

// Non-Farm Payrolls — first Friday of each month
const NFP_DATES = [
  '2025-01-10', '2025-02-07', '2025-03-07', '2025-04-04',
  '2025-05-02', '2025-06-06', '2025-07-03', '2025-08-01',
  '2025-09-05', '2025-10-03', '2025-11-07', '2025-12-05',
  '2026-01-09', '2026-02-06', '2026-03-06', '2026-04-03',
  '2026-05-01', '2026-06-05', '2026-07-02', '2026-08-07',
  '2026-09-04', '2026-10-02', '2026-11-06', '2026-12-04',
];

// GDP advance estimates — quarterly
const GDP_DATES = [
  '2025-01-30', '2025-04-30', '2025-07-30', '2025-10-29',
  '2026-01-29', '2026-04-29', '2026-07-29', '2026-10-28',
];

// BTC options expiry — last Friday of each month (CME + Deribit quarterly)
function generateOptionsExpiries(): string[] {
  const dates: string[] = [];
  for (let y = 2025; y <= 2026; y++) {
    for (let m = 0; m < 12; m++) {
      const lastDay = new Date(y, m + 1, 0);
      const dayOfWeek = lastDay.getDay();
      const lastFriday = new Date(y, m + 1, 0 - ((dayOfWeek + 2) % 7));
      dates.push(lastFriday.toISOString().slice(0, 10));
    }
  }
  return dates;
}

const OPTIONS_DATES = generateOptionsExpiries();

function getMonthName(m: number): string {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m];
}

function buildScheduledEvents(now: Date): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const today = now.toISOString().slice(0, 10);

  const addEvents = (
    dates: string[],
    type: CalendarEvent['type'],
    titleFn: (d: string) => string,
    detailFn: (d: string) => string,
  ) => {
    for (const d of dates) {
      if (d < today) continue;
      const eventDate = new Date(d + 'T00:00:00Z');
      const diff = Math.ceil((eventDate.getTime() - now.getTime()) / 86400000);
      if (diff > 90) continue;
      const imp = IMPACT[type];
      events.push({
        date: d,
        type,
        title: titleFn(d),
        detail: detailFn(d),
        impact: imp.avg,
        impactLabel: imp.label,
        daysUntil: Math.max(0, diff),
      });
    }
  };

  addEvents(FOMC_DATES, 'fomc',
    () => 'FOMC Rate Decision',
    () => 'Federal Reserve interest rate announcement + press conference',
  );

  addEvents(CPI_DATES, 'cpi',
    (d) => `${getMonthName(new Date(d + 'T00:00:00Z').getMonth())} CPI Release`,
    () => 'Consumer Price Index — headline inflation gauge',
  );

  addEvents(PCE_DATES, 'pce',
    (d) => `${getMonthName(new Date(d + 'T00:00:00Z').getMonth())} PCE Release`,
    () => 'Personal Consumption Expenditures — Fed\'s preferred inflation metric',
  );

  addEvents(NFP_DATES, 'jobs',
    (d) => `${getMonthName(new Date(d + 'T00:00:00Z').getMonth())} Jobs Report`,
    () => 'Non-Farm Payrolls — monthly employment data',
  );

  addEvents(GDP_DATES, 'gdp',
    (d) => {
      const q = Math.floor(new Date(d + 'T00:00:00Z').getMonth() / 3) + 1;
      const prevQ = q === 1 ? 4 : q - 1;
      return `Q${prevQ} GDP Advance`;
    },
    () => 'Gross Domestic Product advance estimate',
  );

  addEvents(OPTIONS_DATES, 'options',
    (d) => {
      const m = new Date(d + 'T00:00:00Z').getMonth();
      const isQuarterly = m % 3 === 2;
      return `${getMonthName(m)} Options Expiry${isQuarterly ? ' (Q)' : ''}`;
    },
    (d) => {
      const m = new Date(d + 'T00:00:00Z').getMonth();
      return m % 3 === 2
        ? 'Quarterly CME + Deribit BTC options expiration'
        : 'Monthly BTC options expiration';
    },
  );

  return events;
}

async function getDifficultyEvents(now: Date): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];
  try {
    const res = await fetch('https://mempool.space/api/v1/blocks');
    if (!res.ok) return events;
    const blocks = await res.json();
    if (!blocks?.[0]) return events;

    const currentHeight: number = blocks[0].height;
    const blocksSinceAdj = currentHeight % 2016;
    const blocksUntilAdj = 2016 - blocksSinceAdj;

    // ~10 min per block average
    for (let i = 0; i < 4; i++) {
      const blocksAway = blocksUntilAdj + i * 2016;
      const minutesAway = blocksAway * 10;
      const estDate = new Date(now.getTime() + minutesAway * 60 * 1000);
      const daysUntil = Math.ceil((estDate.getTime() - now.getTime()) / 86400000);
      if (daysUntil > 90) break;

      const targetHeight = currentHeight + blocksAway;
      const imp = IMPACT.difficulty;
      events.push({
        date: estDate.toISOString().slice(0, 10),
        type: 'difficulty',
        title: `Difficulty Adjustment`,
        detail: `Est. block ${targetHeight.toLocaleString()} — ~${blocksAway.toLocaleString()} blocks away`,
        impact: imp.avg,
        impactLabel: imp.label,
        daysUntil: Math.max(0, daysUntil),
      });
    }

    // Halving countdown
    const HALVING_BLOCK = 1_050_000;
    const blocksToHalving = HALVING_BLOCK - currentHeight;
    if (blocksToHalving > 0) {
      const minutesToHalving = blocksToHalving * 10;
      const halvingDate = new Date(now.getTime() + minutesToHalving * 60 * 1000);
      const daysUntil = Math.ceil((halvingDate.getTime() - now.getTime()) / 86400000);
      const imp = IMPACT.halving;
      events.push({
        date: halvingDate.toISOString().slice(0, 10),
        type: 'halving',
        title: 'Bitcoin Halving',
        detail: `Block ${HALVING_BLOCK.toLocaleString()} — reward drops to 1.5625 BTC`,
        impact: imp.avg,
        impactLabel: imp.label,
        daysUntil: Math.max(0, daysUntil),
      });
    }
  } catch { /* silent */ }
  return events;
}

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json({ events: cache.data });
  }

  const now = new Date();
  const [scheduled, blockchain] = await Promise.all([
    Promise.resolve(buildScheduledEvents(now)),
    getDifficultyEvents(now),
  ]);

  const all = [...scheduled, ...blockchain].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (IMPACT[b.type]?.avg ?? 0) - (IMPACT[a.type]?.avg ?? 0);
  });

  cache = { data: all, fetchedAt: Date.now() };
  return NextResponse.json({ events: all });
}
