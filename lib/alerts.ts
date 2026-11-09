import type { SupabaseClient } from '@supabase/supabase-js';
import { getBitcoinPrice, type BitcoinPriceResult } from '@/lib/price';
import { sendPushNotification } from '@/lib/push/sendPush';

interface Delivery {
  id: string;
  alert_id: string;
  claim_token: string;
  channel: 'email' | 'push';
  payload: { email?: string; endpoint: string; p256dh: string; auth: string } | null;
  event: { target_price: number; direction: string; price: number };
}

export function freshAlertPrice(result: BitcoinPriceResult | null, now = Date.now()): boolean {
  if (!result || result.stale || !Number.isFinite(result.data.price) || result.data.price <= 0) return false;
  const timestamp = Date.parse(result.updatedAt);
  return Number.isFinite(timestamp) && timestamp <= now && now - timestamp <= 120_000;
}

export async function sendAlertDelivery(delivery: Delivery): Promise<void> {
  const target = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(delivery.event.target_price);
  const direction = delivery.event.direction === 'above' ? 'risen above' : 'fallen below';
  if (!delivery.payload) throw new Error('recipient_unavailable');
  if (delivery.channel === 'push') {
    await sendPushNotification(delivery.payload, {
      title: 'Bitcoin Price Alert',
      body: `Bitcoin has ${direction} ${target}.`,
      url: '/dashboard',
      tag: `price-alert-${delivery.alert_id}`,
    });
    return;
  }
  if (!process.env.RESEND_API_KEY || !delivery.payload.email) throw new Error('email_unavailable');
  const current = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(delivery.event.price);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(10_000),
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `price-alert/${delivery.alert_id}/email`,
    },
    body: JSON.stringify({
      from: 'Contrabxnd <alerts@contrabxnd.io>',
      to: delivery.payload.email,
      subject: `Bitcoin Price Alert: ${direction} ${target}`,
      text: `Bitcoin has ${direction} ${target}. Price at alert: ${current}. View https://contrabxnd.io/dashboard`,
      html: `
        <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0a0a0a; color: #e8e4dc;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #F7931A; font-size: 14px; letter-spacing: 0.3em; text-transform: uppercase; margin: 0;">Contra&#8383;xnd</h1>
          </div>
          <div style="background: #141414; border: 1px solid #2a2a2a; padding: 30px; margin-bottom: 30px;">
            <p style="color: #F7931A; font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; margin: 0 0 15px 0;">Price Alert Triggered</p>
            <h2 style="font-size: 28px; margin: 0 0 20px 0; color: #e8e4dc;">Bitcoin has ${direction} ${target}</h2>
            <p style="color: #8a8a8a; font-size: 14px; line-height: 1.7; margin: 0;">Current price: <strong style="color: #F7931A;">${current}</strong></p>
          </div>
          <div style="text-align: center;">
            <a href="https://contrabxnd.io/dashboard" style="display: inline-block; background: #F7931A; color: #fff; text-decoration: none; padding: 12px 24px; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase;">View Dashboard</a>
          </div>
          <p style="color: #3a3a3a; font-size: 11px; text-align: center; margin-top: 40px;">You're receiving this because you set a price alert on Contrabxnd.</p>
        </div>
      `,
    }),
  });
  if (!response.ok) throw new Error('email_delivery_failed');
}

export async function checkAlerts(supabase: SupabaseClient, userId: string | null = null): Promise<Response> {
  const started = Date.now();
  let queued = 0;
  let checked = 0;
  let sent = 0;
  let retrying = 0;
  const triggeredIds: string[] = [];
  let price: BitcoinPriceResult | null = null;
  try {
    // Bound the caller even if the shared market-price request hangs. Its late
    // result cannot enqueue anything; only this worker calls the queue RPC.
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      price = await Promise.race([
        getBitcoinPrice(),
        new Promise<null>(resolve => { timer = setTimeout(() => resolve(null), 10_000); }),
      ]);
    } catch {
      price = null;
    } finally {
      clearTimeout(timer);
    }
    const fresh = freshAlertPrice(price);
    if (fresh) {
      const result = await supabase.rpc('queue_price_alerts', {
        p_price: price!.data.price, p_updated_at: price!.updatedAt, p_user_id: userId,
      });
      if (result.error) throw new Error('queue_failed');
      queued = result.data.queued;
      checked = result.data.checked;
      triggeredIds.push(...(result.data.triggered_ids ?? []));
    }
    // Claim one at a time: never leave a batch's leases expiring in memory.
    // Existing durable matches retry even when today's price is unavailable.
    for (let i = 0; i < 100 && Date.now() - started < 40_000; i++) {
      const claim = await supabase.rpc('claim_alert_delivery', { p_user_id: userId });
      if (claim.error) throw new Error('claim_failed');
      const delivery = claim.data as Delivery | null;
      if (!delivery) break;
      let failed = false;
      try {
        await sendAlertDelivery(delivery);
      } catch {
        failed = true;
      }
      const finish = await supabase.rpc('finish_alert_delivery', {
        p_id: delivery.id, p_token: delivery.claim_token, p_error: failed ? 'delivery_failed' : null,
      });
      if (finish.error) throw new Error('finish_failed');
      if (failed) retrying++; else sent++;
      if (finish.data) triggeredIds.push(delivery.alert_id);
    }
    let alerts = [];
    if (userId && triggeredIds.length) {
      const result = await supabase.from('price_alerts').select('*').eq('user_id', userId).in('id', triggeredIds);
      if (result.error) throw new Error('load_completed_failed');
      alerts = result.data ?? [];
    }
    return Response.json({ checked, queued, sent, retrying, triggered: triggeredIds.length, price: fresh ? price!.data.price : null,
      alerts, ...(fresh ? {} : { error: 'Fresh price unavailable; existing deliveries retried' }) },
    { status: fresh ? 200 : 503 });
  } catch {
    // Never log database/provider error objects containing recipients or keys.
    console.error('Alert evaluation or delivery persistence failed');
    return Response.json({ error: 'Alert delivery temporarily unavailable' }, { status: 503 });
  }
}
