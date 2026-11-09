export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const buckets = new Map<string, { count: number; resetAt: number }>();
const MAX_BUCKETS = 10_000;
let nextSweep = 0;

// Process-local fallback only, not a cross-instance quota. Never evict live buckets.
export function consumeProcessRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  if (now >= nextSweep) {
    for (const [key, bucket] of buckets) if (now >= bucket.resetAt) buckets.delete(key);
    nextSweep = now + 60_000;
  }
  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    if (!bucket && buckets.size >= MAX_BUCKETS) return { allowed: false, remaining: 0, resetAt: nextSweep };
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  if (bucket.count < limit) {
    bucket.count++;
    return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
  }
  return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
}
