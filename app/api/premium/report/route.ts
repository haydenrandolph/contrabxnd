import { NextResponse } from 'next/server';
import { lndConfigured, createInvoice } from '@/lib/lightning/client';
import {
  PAYWALL,
  l402Configured,
  mintToken,
  verifyToken,
  preimageMatches,
  parseL402Auth,
  challengeValue,
} from '@/lib/lightning/l402';

export const dynamic = 'force-dynamic';

const RESOURCE = 'premium-report';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.contrabxnd.io';
const TOKEN_TTL_SEC = 3600;

async function fetchInternal(path: string) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, { cache: 'no-store' });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

/** The premium payload — only returned after L402 payment is verified. */
async function buildReport() {
  const [signal, hashrate, brief] = await Promise.all([
    fetchInternal('/api/signal'),
    fetchInternal('/api/hashrate'),
    fetchInternal('/api/brief'),
  ]);
  return {
    generated_at: new Date().toISOString(),
    contrabxnd_score: signal,
    mining_intelligence: hashrate,
    daily_brief: brief?.brief ?? null,
  };
}

export async function GET(req: Request) {
  if (!l402Configured()) {
    return NextResponse.json({ error: 'Paywall not configured' }, { status: 503 });
  }

  const price = PAYWALL[RESOURCE].price_sats;

  // 1. If the client presents valid L402 credentials, serve the resource.
  const auth = parseL402Auth(req.headers.get('authorization'));
  if (auth) {
    const payload = verifyToken(auth.token);
    if (payload && payload.resource === RESOURCE && preimageMatches(auth.preimage, payload.payment_hash)) {
      return NextResponse.json({ paid: true, resource: RESOURCE, report: await buildReport() });
    }
    // Invalid/expired token or wrong preimage → fall through to a fresh challenge.
  }

  // 2. Otherwise issue a 402 challenge with an invoice.
  if (!lndConfigured()) {
    return NextResponse.json({ error: 'Lightning node unavailable — cannot issue invoice' }, { status: 503 });
  }
  try {
    const inv = await createInvoice(price, `Contrabxnd ${RESOURCE}`);
    const token = mintToken({
      payment_hash: inv.payment_hash,
      resource: RESOURCE,
      price_sats: price,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SEC,
    });
    return new NextResponse(
      JSON.stringify({
        error: 'Payment Required',
        resource: RESOURCE,
        description: PAYWALL[RESOURCE].description,
        price_sats: price,
        invoice: inv.payment_request,
        instructions: 'Pay the invoice, then retry this request with header: Authorization: L402 <token>:<preimage>',
      }),
      {
        status: 402,
        headers: {
          'WWW-Authenticate': challengeValue(token, inv.payment_request),
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch {
    return NextResponse.json({ error: 'Could not create invoice' }, { status: 502 });
  }
}
