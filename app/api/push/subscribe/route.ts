import { NextResponse } from 'next/server';
import { requireUser, readJson } from '@/lib/supabase/auth';
import { validPushEndpoint } from '@/lib/push/validation';

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
  const subscription = parsed.body?.subscription;

  if (typeof subscription?.endpoint !== 'string' || subscription.endpoint.length > 4096 ||
      typeof subscription.keys?.p256dh !== 'string' || !/^[A-Za-z0-9_-]{1,256}={0,2}$/.test(subscription.keys.p256dh) ||
      typeof subscription.keys?.auth !== 'string' || !/^[A-Za-z0-9_-]{1,128}={0,2}$/.test(subscription.keys.auth)) {
    return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
  }
  try {
    const endpoint = new URL(subscription.endpoint);
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.hash ||
        !validPushEndpoint(subscription.endpoint)) throw new Error();
  } catch {
    return NextResponse.json({ error: 'Invalid subscription endpoint' }, { status: 400 });
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    }, {
      // endpoint is globally unique. RLS blocks updating another user's row.
      onConflict: 'endpoint',
    });

  if (error) {
    console.error('Failed to save push subscription');
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
  const endpoint = parsed.body?.endpoint;

  if (typeof endpoint !== 'string' || !endpoint || endpoint.length > 4096) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint);

  if (error) {
    console.error('Failed to delete push subscription');
    return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
