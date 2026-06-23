import { NextResponse } from 'next/server';
import { authenticateApiKey, apiResponse } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  try {
    const { data: rows } = await admin
      .from('etf_flows')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (!rows) return apiResponse({ date: null, funds: [], netFlow: null }, auth);

    return apiResponse({
      date: rows.date,
      funds: rows.funds ?? [],
      netFlow: rows.net_flow ?? null,
    }, auth);
  } catch {
    return NextResponse.json({ error: 'ETF flow data unavailable' }, { status: 502 });
  }
}
