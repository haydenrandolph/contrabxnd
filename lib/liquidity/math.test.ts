import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMacroNumber, fredMillions, netLiquidity, liquidityInputsFresh } from './math';

test('macro parser preserves both numeric and string zero without inventing missing zeros', () => {
  assert.equal(parseMacroNumber(0), 0);
  assert.equal(parseMacroNumber('0'), 0);
  assert.equal(parseMacroNumber('1,234.5'), 1234.5);
  for (const value of [null, undefined, '', ' ', '.', '12junk', Infinity]) {
    assert.equal(parseMacroNumber(value), null);
  }
});

test('M2 billions are normalized to millions; WALCL is already millions', () => {
  assert.equal(fredMillions('M2SL', 22000), 22_000_000);
  assert.equal(fredMillions('WALCL', 6_000_000), 6_000_000);
  assert.equal(fredMillions('M2SL', null), null);
});

test('net liquidity accepts legitimate zero RRP but rejects incomplete inputs', () => {
  assert.equal(netLiquidity(6_000_000, 800_000, 0), 5_200_000);
  assert.equal(netLiquidity(6_000_000, 800_000, null), null);
  assert.equal(netLiquidity(0, 800_000, 0), null);
  assert.equal(netLiquidity(NaN, 800_000, 0), null);
});

test('a current ingestion date cannot hide stale source observations', () => {
  const now = Date.parse('2026-11-08T12:00:00Z');
  const raw = { walcl_date: '2026-11-04', tga: { record_date: '2026-11-06' }, rrp: { operationDate: '2026-11-06' } };
  assert.equal(liquidityInputsFresh(raw, now), true);
  assert.equal(liquidityInputsFresh({ ...raw, walcl_date: '2026-09-01' }, now), false);
  assert.equal(liquidityInputsFresh({ ...raw, rrp: {} }, now), false);
  assert.equal(liquidityInputsFresh(null, now), false);
});
