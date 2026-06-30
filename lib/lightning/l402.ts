/**
 * L402 — the Lightning-native HTTP 402 paywall protocol (formerly LSAT).
 *
 * Flow:
 *   1. Client GETs a gated resource with no auth.
 *   2. Server replies 402 with `WWW-Authenticate: L402 macaroon="<token>", invoice="<bolt11>"`.
 *   3. Client pays the invoice, obtaining the preimage.
 *   4. Client retries with `Authorization: L402 <token>:<preimage>`.
 *   5. Server verifies the token signature AND that sha256(preimage) == the
 *      payment_hash bound in the token → serves the resource.
 *
 * The "macaroon" here is a compact server-signed token (HMAC-SHA256). Generic
 * L402 clients treat it as an opaque blob and echo it back with the preimage,
 * so this is wire-compatible while staying dependency-free. The security holds:
 * the token is tamper-proof (HMAC) and possession of the preimage proves the
 * invoice was settled (the preimage is only revealed on payment).
 */
import crypto from 'crypto';

const SECRET = process.env.L402_SECRET || '';

export interface L402Payload {
  payment_hash: string; // hex
  resource: string;
  price_sats: number;
  exp: number; // unix seconds
}

/** Paywalled resources and their sat prices. */
export const PAYWALL: Record<string, { price_sats: number; description: string }> = {
  'premium-report': {
    price_sats: 100,
    description: 'Full Contrabxnd intelligence report: composite score with every component breakdown, macro signals, and mining intelligence.',
  },
};

export function l402Configured(): boolean {
  return SECRET.length >= 16;
}

export function mintToken(p: L402Payload): string {
  const body = Buffer.from(JSON.stringify(p)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyToken(token: string): L402Payload | null {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString()) as L402Payload;
    if (p.exp && Math.floor(Date.now() / 1000) > p.exp) return null;
    return p;
  } catch {
    return null;
  }
}

/** True iff sha256(preimage) === payment_hash (the proof of payment). */
export function preimageMatches(preimageHex: string, paymentHashHex: string): boolean {
  try {
    const pre = Buffer.from(preimageHex, 'hex');
    if (pre.length !== 32) return false;
    const h = crypto.createHash('sha256').update(pre).digest();
    const target = Buffer.from(paymentHashHex, 'hex');
    if (h.length !== target.length) return false;
    return crypto.timingSafeEqual(h, target);
  } catch {
    return false;
  }
}

/** Parse `Authorization: L402 <token>:<preimage>` (also accepts legacy LSAT). */
export function parseL402Auth(header: string | null): { token: string; preimage: string } | null {
  if (!header) return null;
  const m = header.match(/^(?:L402|LSAT)\s+([A-Za-z0-9_\-=.]+):([0-9a-fA-F]{64})$/);
  if (!m) return null;
  return { token: m[1], preimage: m[2] };
}

export function challengeValue(token: string, invoice: string): string {
  return `L402 macaroon="${token}", invoice="${invoice}"`;
}
