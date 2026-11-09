import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEtfSnapshot } from './scrapers';
import type { EtfSnapshot } from './types';

test('ETF issuer snapshots require real dates and complete positive core fields', t => {
  t.mock.method(Date, 'now', () => Date.parse('2026-11-08T12:00:00Z'));
  const snapshot: EtfSnapshot = {
    ticker: 'IBIT', fund_name: 'iShares Bitcoin Trust', date: 'Nov 6, 2026', nav_per_share: 50,
    shares_outstanding: 1_000_000, total_net_assets: 50_000_000, market_price: null,
    volume: null, premium_discount: null, source: 'blackrock', raw_data: {},
  };
  assert.equal(validateEtfSnapshot(snapshot)?.date, '2026-11-06');
  assert.equal(validateEtfSnapshot({ ...snapshot, date: '' }), null);
  assert.equal(validateEtfSnapshot({ ...snapshot, shares_outstanding: 0 }), null);
  assert.equal(validateEtfSnapshot({ ...snapshot, total_net_assets: NaN }), null);
});
