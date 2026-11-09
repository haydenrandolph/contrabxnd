import { NextResponse } from 'next/server';
import { authenticateApiKey, apiResponse } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { GET as getEtfFlows } from '@/app/api/etf-flows/route';

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  try {
    // Use the same validated dollar-denominated snapshot calculation as public.
    const response = await getEtfFlows();
    return apiResponse(await response.json(), auth);
  } catch {
    return NextResponse.json({ error: 'ETF flow data unavailable' }, { status: 502 });
  }
}
