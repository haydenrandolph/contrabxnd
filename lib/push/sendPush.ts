import webpush from 'web-push';
import { validPushEndpoint, validPushKeys } from './validation';

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<void> {
  // Recheck persisted rows too: subscriptions can bypass the HTTP route.
  if (!validPushEndpoint(subscription.endpoint) || !validPushKeys(subscription.p256dh, subscription.auth)) {
    throw new Error('push_invalid_subscription');
  }
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    throw new Error('push_not_configured');
  }

  try {
    const request = webpush.generateRequestDetails(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload),
      { TTL: 3600, vapidDetails: {
        subject: 'mailto:alerts@contrabxnd.io', publicKey: vapidPublicKey, privateKey: vapidPrivateKey,
      } }
    );
    // fetch supplies a hard deadline (not just socket inactivity) and never
    // follows provider redirects to an unvalidated destination.
    const response = await fetch(subscription.endpoint, {
      method: 'POST', headers: request.headers, body: new Uint8Array(request.body),
      signal: AbortSignal.timeout(10_000), redirect: 'error',
    });
    if (!response.ok) throw new Error();
  } catch {
    // web-push errors include endpoint URLs, request headers and response bodies.
    throw new Error('push_delivery_failed');
  }
}
