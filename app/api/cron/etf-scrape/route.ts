import { NextResponse } from 'next/server';
import { cronGuard } from '@/lib/audit-guards';
import { createAdminClient } from '@/lib/supabase/server';
import { scrapeAll } from '@/lib/etf/scrapers';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  const denied = cronGuard(request);
  if (denied) return denied;

  const results: Array<{ ticker: string; status: string }> = [];
  let total = 0;
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const snapshots = await scrapeAll();
    total = snapshots.length;
    const missing = ['ARKB', 'IBIT'].filter(ticker => !snapshots.some(s => s.ticker === ticker));

    if (snapshots.length === 0) {
      return NextResponse.json({ error: 'All scrapers failed', stored: 0, total: 0, failed: 2 }, { status: 503 });
    }

    for (const snap of snapshots) {
      try {
        const { error } = await supabase
          .from('etf_snapshots')
          .upsert(
            {
              ticker: snap.ticker,
              date: snap.date,
              fund_name: snap.fund_name,
              nav_per_share: snap.nav_per_share,
              shares_outstanding: snap.shares_outstanding,
              total_net_assets: snap.total_net_assets,
              market_price: snap.market_price,
              volume: snap.volume,
              premium_discount: snap.premium_discount,
              source: snap.source,
              raw_data: snap.raw_data,
            },
            { onConflict: 'ticker,date' },
          );

        if (error) {
          results.push({ ticker: snap.ticker, status: 'write_failed' });
        } else {
          results.push({ ticker: snap.ticker, status: 'stored' });
        }
      } catch {
        results.push({ ticker: snap.ticker, status: 'write_failed' });
      }
    }

    results.push(...missing.map(ticker => ({ ticker, status: 'scrape_failed' })));
    const failed = results.filter(r => r.status !== 'stored').length;
    return NextResponse.json({
      success: failed === 0,
      stored: results.filter(r => r.status === 'stored').length,
      total: snapshots.length,
      failed,
      results,
    }, { status: failed > 0 ? 503 : 200 });
  } catch {
    return NextResponse.json({ error: 'ETF ingestion failed', stored: results.filter(r => r.status === 'stored').length, total }, { status: 503 });
  }
}
