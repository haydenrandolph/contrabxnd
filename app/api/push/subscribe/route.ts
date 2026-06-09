import { NextResponse } from 'next/server';
import { requireUser, readJson } from '@/lib/supabase/auth';

interface PushSubscriptionBody {
  subscription?: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
}

// POST - Save push subscription
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const parsed = await readJson<PushSubscriptionBody>(request);
  if (parsed.error) return parsed.error;
  const { subscription } = parsed.body;

  if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    }, {
      onConflict: 'user_id,endpoint',
    });

  if (error) {
    console.error('Failed to save push subscription:', error.message);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE - Remove push subscription
export async function DELETE(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const parsed = await readJson<{ endpoint?: string }>(request);
  if (parsed.error) return parsed.error;
  const { endpoint } = parsed.body;

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint);

  if (error) {
    console.error('Failed to delete push subscription:', error.message);
    return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
