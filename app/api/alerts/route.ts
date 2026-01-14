import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Fetch all alerts for current user
export async function GET() {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('price_alerts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ alerts: data });
}

// POST - Create a new price alert
export async function POST(request: Request) {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { targetPrice, direction, notifyEmail, notifyPush } = await request.json();

  if (!targetPrice || !direction) {
    return NextResponse.json({ error: 'Missing target price or direction' }, { status: 400 });
  }

  if (!['above', 'below'].includes(direction)) {
    return NextResponse.json({ error: 'Direction must be "above" or "below"' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('price_alerts')
    .insert({
      user_id: user.id,
      target_price: targetPrice,
      direction,
      notify_email: notifyEmail ?? true,
      notify_push: notifyPush ?? false,
      triggered: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ alert: data });
}

// DELETE - Delete an alert
export async function DELETE(request: Request) {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { alertId } = await request.json();

  if (!alertId) {
    return NextResponse.json({ error: 'Missing alert ID' }, { status: 400 });
  }

  const { error } = await supabase
    .from('price_alerts')
    .delete()
    .eq('id', alertId)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
