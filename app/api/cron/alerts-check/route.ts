import { cronGuard } from '@/lib/audit-guards';
import { createAdminClient } from '@/lib/supabase/server';
import { checkAlerts } from '@/lib/alerts';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const denied = cronGuard(request);
  if (denied) return denied;
  const supabase = createAdminClient();
  if (!supabase) return Response.json({ error: 'Alert delivery not configured' }, { status: 503 });
  return checkAlerts(supabase);
}
