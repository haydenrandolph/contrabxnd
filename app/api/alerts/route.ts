import { NextResponse } from 'next/server';
import { requireUser, readJson } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/server';

// GET - Fetch all alerts for current user
export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from('price_alerts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load alerts:', error.message);
    return NextResponse.json({ error: 'Failed to load alerts' }, { status: 500 });
  }

  return NextResponse.json({ alerts: data });
}

// POST - Create a new price alert
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user } = auth;

  const parsed = await readJson<{
    targetPrice?: unknown;
    direction?: unknown;
    notifyEmail?: boolean;
    notifyPush?: boolean;
  }>(request);
  if (parsed.error) return parsed.error;
  const { targetPrice, direction, notifyEmail, notifyPush } = parsed.body ?? {};

  if (typeof targetPrice !== 'number' || !Number.isFinite(targetPrice) || targetPrice <= 0) {
    return NextResponse.json({ error: 'Target price must be a positive number' }, { status: 400 });
  }

  if (direction !== 'above' && direction !== 'below') {
    return NextResponse.json({ error: 'Direction must be "above" or "below"' }, { status: 400 });
  }

  if ((notifyEmail !== undefined && typeof notifyEmail !== 'boolean') ||
      (notifyPush !== undefined && typeof notifyPush !== 'boolean')) {
    return NextResponse.json({ error: 'Notification preferences must be boolean' }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: 'Alert delivery not configured' }, { status: 503 });

  const { data, error } = await supabase
    .from('price_alerts')
    .insert({
      user_id: user.id,
      target_price: targetPrice,
      direction,
      notify_email: notifyEmail ?? true,
      notify_push: notifyPush ?? false,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create alert:', error.message);
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
  }

  return NextResponse.json({ alert: data });
}

// DELETE - Delete an alert
export async function DELETE(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const parsed = await readJson<{ alertId?: string }>(request);
  if (parsed.error) return parsed.error;
  const { alertId } = parsed.body;

  if (!alertId) {
    return NextResponse.json({ error: 'Missing alert ID' }, { status: 400 });
  }

  const { error } = await supabase
    .from('price_alerts')
    .delete()
    .eq('id', alertId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Failed to delete alert:', error.message);
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
