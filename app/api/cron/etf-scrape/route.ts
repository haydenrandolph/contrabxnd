import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { scrapeAll } from '@/lib/etf/scrapers';

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

  const snapshots = await scrapeAll();

  if (snapshots.length === 0) {
    return NextResponse.json({ error: 'All scrapers failed', stored: 0 }, { status: 502 });
  }

  const results: Array<{ ticker: string; status: string }> = [];

  for (const snap of snapshots) {
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
      console.error(`Failed to store ${snap.ticker}:`, error);
      results.push({ ticker: snap.ticker, status: `error: ${error.message}` });
    } else {
      results.push({ ticker: snap.ticker, status: 'stored' });
    }
  }

  return NextResponse.json({
    stored: results.filter(r => r.status === 'stored').length,
    total: snapshots.length,
    results,
  });
}
