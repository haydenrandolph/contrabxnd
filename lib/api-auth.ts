import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';

interface RateBucket {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateBucket>();

const TIERS = {
  free: { requests: 60, windowMs: 60 * 60 * 1000 },
  paid: { requests: 600, windowMs: 60 * 60 * 1000 },
} as const;

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

function checkRateLimit(keyHash: string, tier: 'free' | 'paid'): { allowed: boolean; remaining: number; resetAt: number } {
  const limit = TIERS[tier];
  const now = Date.now();
  let bucket = rateLimits.get(keyHash);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + limit.windowMs };
    rateLimits.set(keyHash, bucket);
  }

  bucket.count++;
  const remaining = Math.max(0, limit.requests - bucket.count);
  return { allowed: bucket.count <= limit.requests, remaining, resetAt: bucket.resetAt };
}

export type ApiAuthResult =
  | { ok: true; userId: string; keyHash: string; tier: 'free' | 'paid' }
  | { ok: false; response: NextResponse };

export async function authenticateApiKey(req: Request): Promise<ApiAuthResult> {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey || !apiKey.startsWith('cbx_')) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Missing or invalid API key. Pass your key via the x-api-key header.' },
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
  const { data: keyRow } = await admin
    .from('api_keys')
    .select('user_id, revoked_at, tier')
    .eq('key_hash', keyHash)
    .single();

  if (!keyRow || keyRow.revoked_at) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 401 }),
    };
  }

  const tier: 'free' | 'paid' = keyRow.tier === 'paid' ? 'paid' : 'free';
  const rl = checkRateLimit(keyHash, tier);

  if (!rl.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Rate limit exceeded', limit: TIERS[tier].requests, resetAt: new Date(rl.resetAt).toISOString() },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(TIERS[tier].requests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)),
            'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          },
        },
      ),
    };
  }

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
        'Cache-Control': 'public, max-age=30',
      },
    },
  );
}
