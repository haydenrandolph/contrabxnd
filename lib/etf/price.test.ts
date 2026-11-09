import test from 'node:test';
import assert from 'node:assert/strict';
import { getBitcoinPrice } from '../price';

test('price fallback is marked stale and expires against the actual source timestamp', async t => {
  let now = Date.parse('2026-11-08T12:00:00Z');
  t.mock.method(Date, 'now', () => now);
  let fail = false;
  t.mock.method(globalThis, 'fetch', async () => fail ? new Response('', { status: 503 }) : Response.json({
    bitcoin: { usd: 100000, usd_24h_change: 1, usd_market_cap: 2e12, usd_24h_vol: 1e10, last_updated_at: now / 1000 },
  }));
  assert.equal((await getBitcoinPrice())?.stale, undefined);
  now += 60_000;
  fail = true;
  assert.equal((await getBitcoinPrice())?.stale, true);
  now += 5 * 60_000;
  assert.equal(await getBitcoinPrice(), null);
});
