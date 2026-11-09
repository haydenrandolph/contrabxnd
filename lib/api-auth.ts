import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { isIP } from 'node:net';
import { createAdminClient } from '@/lib/supabase/server';
import { consumeProcessRateLimit, type RateLimitResult } from '@/lib/audit-rate-limit';

const TIERS = {
  free: { requests: 60, windowMs: 60 * 60 * 1000 },
  paid: { requests: 600, windowMs: 60 * 60 * 1000 },
} as const;

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export async function enforceRateLimit(key: string, limit: number, windowMs: number): Promise<NextResponse | null> {
  let result: RateLimitResult;
  const keyHash = hashKey(key);
  if (process.env.VERCEL || process.env.NODE_ENV === 'production' || process.env.RATE_LIMIT_BACKEND === 'supabase') {
    // RPC must atomically consume a shared bucket, accessible only to service_role.
    // Returns one row: { allowed: boolean, remaining: integer, reset_at: timestamptz }.
    try {
      const admin = createAdminClient();
      if (!admin) throw new Error('Database unavailable');
      const { data, error } = await admin.rpc('consume_api_rate_limit', {
        p_key: keyHash, p_limit: limit, p_window_ms: windowMs,
      });
      const row = Array.isArray(data) && data.length === 1 ? data[0] : null;
      const resetAt = Date.parse(row?.reset_at);
      if (error || !row || typeof row.allowed !== 'boolean' || !Number.isInteger(row.remaining) ||
          row.remaining < 0 || row.remaining >= limit || (!row.allowed && row.remaining !== 0) ||
          !Number.isFinite(resetAt) || resetAt <= Date.now() || resetAt > Date.now() + windowMs + 60_000) {
        throw new Error('Invalid rate limit response');
      }
      result = { allowed: row.allowed, remaining: row.remaining, resetAt };
    } catch {
      return NextResponse.json({ error: 'Rate limiter unavailable' }, { status: 503 });
    }
  } else {
    result = consumeProcessRateLimit(keyHash, limit, windowMs);
  }
  if (result.allowed) return null;
  return NextResponse.json(
    { error: 'Rate limit exceeded', limit, resetAt: new Date(result.resetAt).toISOString() },
    { status: 429, headers: {
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
      'Retry-After': String(Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))),
    } },
  );
}

export async function limitInvoiceCreation(identity: string): Promise<NextResponse | null> {
  const denied = await enforceRateLimit(`invoice:${identity}`, 10, 10 * 60 * 1000);
  if (denied) return denied;
  return enforceRateLimit('invoice:global', 300, 60 * 60 * 1000);
}

export function invoiceRequestIdentity(req: Request): string {
  // Only trust the platform-provided address on Vercel. Else use a shared budget.
  const ip = process.env.VERCEL ? req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() : null;
  return `anonymous:${ip && isIP(ip) ? ip : 'unknown'}`;
}

export type ApiAuthResult =
  | { ok: true; userId: string; keyHash: string; tier: 'free' | 'paid' }
  | { ok: false; response: NextResponse };

export async function authenticateApiKey(req: Request, source: 'header' | 'bearer' = 'header'): Promise<ApiAuthResult> {
  const authorization = req.headers.get('authorization');
  const apiKey = source === 'bearer'
    ? (authorization?.startsWith('Bearer ') ? authorization.slice(7) : null)
    : req.headers.get('x-api-key');
  if (!apiKey || !apiKey.startsWith('cbx_') || apiKey.length > 256) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Missing or invalid API key. ${source === 'bearer' ? 'Use Authorization: Bearer <key>.' : 'Pass your key via the x-api-key header.'}` },
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ),
    };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Service unavailable' }, { status: 503 }),
    };
  }

  const keyHash = hashKey(apiKey);
  const { data: keyRow, error } = await admin
    .from('api_keys')
    .select('user_id, revoked_at, tier')
    .eq('key_hash', keyHash)
    .single();

  if (error && error.code !== 'PGRST116') {
    return { ok: false, response: NextResponse.json({ error: 'Authentication unavailable' }, { status: 503 }) };
  }
  if (!keyRow || keyRow.revoked_at || typeof keyRow.user_id !== 'string' || !keyRow.user_id) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 401 }),
    };
  }

  const tier: 'free' | 'paid' = keyRow.tier === 'paid' ? 'paid' : 'free';
  const denied = await enforceRateLimit(`api:${keyHash}`, TIERS[tier].requests, TIERS[tier].windowMs);
  if (denied) return { ok: false, response: denied };

  admin
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', keyHash)
    .then(() => {});

  return { ok: true, userId: keyRow.user_id, keyHash, tier };
}

export function apiResponse(data: Record<string, unknown>, auth: { tier: string }, cached = false) {
  return NextResponse.json(
    {
      data,
      meta: {
        source: 'contrabxnd',
        timestamp: new Date().toISOString(),
        cached,
      },
    },
    {
      headers: {
        'X-Powered-By': 'Contrabxnd API',
        'X-Tier': auth.tier,
        'Cache-Control': 'private, no-store',
      },
    },
  );
}
