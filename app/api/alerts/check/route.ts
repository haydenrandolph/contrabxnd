import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/auth';
import { getBitcoinPrice } from '@/lib/price';
import { sendPushNotification } from '@/lib/push/sendPush';

// POST - Check and trigger the current user's alerts against the live price.
// The price is fetched server-side (never trusted from the client) so a user
// can't force-trigger their own alerts by POSTing an arbitrary number.
export async function POST() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const priceResult = await getBitcoinPrice();
  if (!priceResult) {
    return NextResponse.json({ error: 'Could not determine current price' }, { status: 503 });
  }
  const currentPrice = priceResult.data.price;

  // Get user's untriggered alerts
  const { data: alerts, error: fetchError } = await supabase
    .from('price_alerts')
    .select('*')
    .eq('user_id', user.id)
    .eq('triggered', false);

  if (fetchError) {
    console.error('Failed to load alerts:', fetchError.message);
    return NextResponse.json({ error: 'Failed to load alerts' }, { status: 500 });
  }

  const triggeredAlerts = [];

  for (const alert of alerts || []) {
    const shouldTrigger =
      (alert.direction === 'above' && currentPrice >= alert.target_price) ||
      (alert.direction === 'below' && currentPrice <= alert.target_price);

    if (shouldTrigger) {
      // Mark alert as triggered
      const { error: updateError } = await supabase
        .from('price_alerts')
        .update({
          triggered: true,
          triggered_at: new Date().toISOString(),
        })
        .eq('id', alert.id);

      if (!updateError) {
        triggeredAlerts.push(alert);

        // Send email notification if enabled
        if (alert.notify_email) {
          try {
            await sendAlertEmail(user.email!, alert, currentPrice);
          } catch (e) {
            console.error('Failed to send alert email:', e);
          }
        }

        // Send push notification if enabled
        if (alert.notify_push) {
          try {
            await sendAlertPush(supabase, user.id, alert, currentPrice);
          } catch (e) {
            console.error('Failed to send alert push:', e);
          }
        }
      }
    }
  }

  return NextResponse.json({
    checked: alerts?.length || 0,
    triggered: triggeredAlerts.length,
    price: currentPrice,
    alerts: triggeredAlerts,
  });
}

async function sendAlertPush(
  supabase: Awaited<ReturnType<typeof requireUser>>['supabase'],
  userId: string,
  alert: { target_price: number; direction: string },
  currentPrice: number,
) {
  if (!supabase) return;

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (!subscriptions?.length) return;

  const direction = alert.direction === 'above' ? 'risen above' : 'fallen below';
  const formattedTarget = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(alert.target_price);

  await Promise.all(
    subscriptions.map((sub) =>
      sendPushNotification(sub, {
        title: 'Bitcoin Price Alert',
        body: `Bitcoin has ${direction} ${formattedTarget}.`,
        url: '/dashboard',
        tag: 'price-alert',
      }),
    ),
  );
}

async function sendAlertEmail(email: string, alert: { target_price: number; direction: string }, currentPrice: number) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.warn('Resend API key not configured, skipping email');
    return;
  }

  const direction = alert.direction === 'above' ? 'risen above' : 'fallen below';
  const formattedTarget = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(alert.target_price);
  const formattedCurrent = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(currentPrice);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Contrabxnd <alerts@contrabxnd.io>',
      to: email,
      subject: `Bitcoin Price Alert: ${direction} ${formattedTarget}`,
      html: `
        <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0a0a0a; color: #e8e4dc;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #F7931A; font-size: 14px; letter-spacing: 0.3em; text-transform: uppercase; margin: 0;">
              Contra₿and
            </h1>
          </div>

          <div style="background: #141414; border: 1px solid #2a2a2a; padding: 30px; margin-bottom: 30px;">
            <p style="color: #F7931A; font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; margin: 0 0 15px 0;">
              Price Alert Triggered
            </p>
            <h2 style="font-size: 28px; margin: 0 0 20px 0; color: #e8e4dc;">
              Bitcoin has ${direction} ${formattedTarget}
            </h2>
            <p style="color: #8a8a8a; font-size: 14px; line-height: 1.7; margin: 0;">
              Current price: <strong style="color: #F7931A;">${formattedCurrent}</strong>
            </p>
          </div>

          <div style="text-align: center;">
            <a href="https://contrabxnd.io/dashboard" style="display: inline-block; background: #F7931A; color: #fff; text-decoration: none; padding: 12px 24px; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase;">
              View Dashboard
            </a>
          </div>

          <p style="color: #3a3a3a; font-size: 11px; text-align: center; margin-top: 40px;">
            You're receiving this because you set a price alert on Contrabxnd.
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send email: ${response.statusText}`);
  }
}
