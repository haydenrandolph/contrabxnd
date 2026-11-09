import type { SlrSnapshot, FedPolicyEntry } from './types';
import { isFreshDate } from '../etf/math';

// ---------------------------------------------------------------------------
// 1. FRED API helpers
// ---------------------------------------------------------------------------

const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations';

async function fetchFredSeries(
  seriesId: string,
  apiKey: string,
): Promise<{ value: number; date: string } | null> {
  try {
    const url =
      `${FRED_BASE}?series_id=${seriesId}&sort_order=desc&limit=1&file_type=json&api_key=${apiKey}`;
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) });

    if (!res.ok) {
      console.warn(`FRED ${seriesId}: HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    const value = data?.observations?.[0]?.value;

    if (value === undefined || value === '.' || value === null) {
      console.warn(`FRED ${seriesId}: no valid observation`);
      return null;
    }

    const parsed = parseFloat(value);
    const date = data?.observations?.[0]?.date;
    const maxAge = seriesId === 'NFCILEVERAGE' ? 14 : 150;
    return Number.isFinite(parsed) && isFreshDate(date, maxAge) ? { value: parsed, date } : null;
  } catch (err) {
    console.error(`FRED ${seriesId} fetch failed:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 2. Fed RSS parser — regex-based, no XML dependency
// ---------------------------------------------------------------------------

const SLR_KEYWORDS =
  /supplementary leverage|SLR|leverage ratio|capital requirements|eSLR/i;

const EASING_KEYWORDS =
  /easing|exemption|recalibration|reduce|relief|exclude|lower/i;

const TIGHTENING_KEYWORDS =
  /tightening|increase requirement|restore|raise|stricter|higher/i;

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  // Match each <item>...</item> block
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const title = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim() ?? '';
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? '';
    const description =
      block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1]?.trim() ?? '';
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? '';

    items.push({ title, link, description, pubDate });
  }

  return items;
}

function isBankingRegulation(item: RssItem): boolean {
  return item.link.includes('bcreg');
}

function isSlrRelated(item: RssItem): boolean {
  return (
    SLR_KEYWORDS.test(item.title) || SLR_KEYWORDS.test(item.description)
  );
}

export function classifyPolicySignal(item: RssItem): number | null {
  const text = `${item.title} ${item.description}`;
  const easing = EASING_KEYWORDS.test(text);
  const tightening = TIGHTENING_KEYWORDS.test(text);
  return easing === tightening ? null : easing ? 1 : -1;
}

async function fetchFedRssPolicySignal(): Promise<{
  policy_signal: number | null;
  policy_event: string | null;
  rss_entries: FedPolicyEntry[];
}> {
  try {
    const res = await fetch(
      'https://www.federalreserve.gov/feeds/press_all.xml',
      { cache: 'no-store', signal: AbortSignal.timeout(8000) },
    );

    if (!res.ok) {
      console.warn(`Fed RSS: HTTP ${res.status}`);
      return { policy_signal: null, policy_event: null, rss_entries: [] };
    }

    const xml = await res.text();
    const items = parseRssItems(xml);

    // Filter to banking regulation entries that mention SLR-related terms
    const relevant = items
      .filter(item => isBankingRegulation(item) && isSlrRelated(item));

    // Only consider entries from the last 30 days
    const recent = relevant.filter(item => isFreshDate(item.pubDate, 30))
      .sort((a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate));

    const rssEntries: FedPolicyEntry[] = relevant.slice(0, 5).map(item => ({
      title: item.title,
      link: item.link,
      description: item.description,
      pubDate: item.pubDate,
    }));

    if (recent.length === 0) {
      // Absence of recent news does not establish the current policy state.
      return {
        policy_signal: null,
        policy_event: recent.length === 0 && relevant.length > 0
          ? relevant[0].title
          : null,
        rss_entries: rssEntries,
      };
    }

    // Use the most recent relevant entry to determine signal
    const latest = recent[0];
    const signal = classifyPolicySignal(latest);

    return {
      policy_signal: signal,
      policy_event: latest.title,
      rss_entries: rssEntries,
    };
  } catch (err) {
    console.error('Fed RSS fetch failed:', err);
    return { policy_signal: null, policy_event: null, rss_entries: [] };
  }
}

// ---------------------------------------------------------------------------
// 3. Main scraper: assemble the full SLR snapshot
// ---------------------------------------------------------------------------

export async function scrapeSlr(): Promise<SlrSnapshot> {
  const todayStr = new Date().toISOString().split('T')[0];
  const fredKey = process.env.FRED_API_KEY;

  // Track A: FRED series (parallel fetch)
  let leverageSubindex: number | null = null;
  let tier1LeverageCapital: number | null = null;
  let fredRaw: Record<string, unknown> = {};

  if (fredKey) {
    const [nfci, tier1] = await Promise.all([
      fetchFredSeries('NFCILEVERAGE', fredKey),
      fetchFredSeries('QBPBSLEVK', fredKey),
    ]);
    leverageSubindex = nfci?.value ?? null;
    tier1LeverageCapital = tier1?.value ?? null;
    fredRaw = {
      nfci_leverage: nfci?.value ?? null, nfci_leverage_date: nfci?.date ?? null,
      tier1_leverage_capital: tier1?.value ?? null, tier1_leverage_capital_date: tier1?.date ?? null,
    };
  } else {
    console.warn('FRED_API_KEY not set — FRED fields will be null');
  }

  // Track B: Fed RSS policy signal
  const { policy_signal, policy_event, rss_entries } =
    await fetchFedRssPolicySignal();

  return {
    date: todayStr,
    leverage_subindex: leverageSubindex,
    tier1_leverage_capital: tier1LeverageCapital,
    policy_signal,
    policy_event,
    source: 'fred+fedrss',
    raw_data: {
      fred: fredRaw,
      rss_entries,
    },
  };
}
