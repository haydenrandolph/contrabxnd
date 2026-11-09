import test from 'node:test';
import assert from 'node:assert/strict';
import { etfFlowDollars, scoreEtfFlow, normalizeIssuerDate, isFreshDate } from './math';

test('ETF share changes produce dollars and signal thresholds use $500 million', () => {
  const prev = { nav_per_share: 49, shares_outstanding: 10_000_000, total_net_assets: 490_000_000 };
  const curr = { nav_per_share: 50, shares_outstanding: 11_000_000, total_net_assets: 550_000_000 };
  assert.equal(etfFlowDollars(curr, prev), 50_000_000);
  assert.equal(scoreEtfFlow(50_000_000), 10);
  assert.equal(scoreEtfFlow(-250_000_000), -50);
  assert.equal(scoreEtfFlow(500_000_000), 100);
  assert.equal(scoreEtfFlow(1_000_000_000), 100);
  assert.equal(etfFlowDollars(curr, curr), 0);
});

test('missing, zero and nonfinite ETF holdings never manufacture flows', () => {
  const good = { nav_per_share: 50, shares_outstanding: 10_000_000, total_net_assets: 500_000_000 };
  for (const bad of [NaN, Infinity, 0, -1, null]) {
    assert.equal(etfFlowDollars({ ...good, shares_outstanding: bad as number }, good), null);
    assert.equal(etfFlowDollars(good, { ...good, nav_per_share: bad as number }), null);
    assert.equal(etfFlowDollars({ ...good, total_net_assets: bad as number }, good), null);
  }
  assert.equal(etfFlowDollars({ ...good, shares_outstanding: Number.MAX_VALUE }, good), null);
});

test('issuer dates must be present, possible, recent and not future', () => {
  const now = Date.parse('2026-11-08T12:00:00Z');
  assert.equal(normalizeIssuerDate(undefined, now), null);
  assert.equal(normalizeIssuerDate('2026-02-30', now), null);
  assert.equal(normalizeIssuerDate('2026-10-01', now), null);
  assert.equal(normalizeIssuerDate('2026-11-09', now), null);
  assert.equal(normalizeIssuerDate('Nov 6, 2026', now), '2026-11-06');
  assert.equal(isFreshDate('invalid', 5, now), false);
  assert.equal(isFreshDate('2026-11-31', 5, Date.parse('2026-12-02')), false);
});
