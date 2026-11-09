import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { checkAlerts } from '@/lib/alerts';

export const maxDuration = 60;

export async function POST() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: 'Alert delivery not configured' }, { status: 503 });
  // Never accept ownership or a price from the request body.
  return checkAlerts(supabase, auth.user.id);
}
