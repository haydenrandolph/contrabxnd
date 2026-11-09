import test from 'node:test';
import assert from 'node:assert/strict';
import { binaryOutcomePrices, bullishProbability, currentBullishMarkets, type MarketRow } from './math';

test('binary prices follow labeled outcomes rather than array position', () => {
  assert.deepEqual(binaryOutcomePrices('["No","Yes"]', '["0.2","0.8"]'), { yes: 0.8, no: 0.2 });
  assert.equal(binaryOutcomePrices('["Up","Down"]', '["0.2","0.8"]'), null);
  assert.equal(binaryOutcomePrices('["Yes","No"]', '[null,1]'), null);
  assert.equal(binaryOutcomePrices('["Yes","No"]', '["",1]'), null);
  assert.equal(binaryOutcomePrices('["Yes","No"]', '[0.8,0.8]'), null);
});

test('ambiguous and bearish questions are excluded from bullish scoring', () => {
  assert.equal(bullishProbability('bitcoin-below-50k', 0.9), null);
  assert.equal(bullishProbability('bitcoin-price-range', 0.9), null);
  assert.equal(bullishProbability('us-national-bitcoin-reserve-before-2027', 0.8), 0.8);
});

test('old, expired, inactive or unlabeled snapshots cannot form a current signal', t => {
  t.mock.method(Date, 'now', () => Date.parse('2026-11-08T12:00:00Z'));
  const row: MarketRow = {
    date: '2026-11-08', market_id: '1', slug: 'us-national-bitcoin-reserve-before-2027',
    question: 'US national Bitcoin reserve before 2027?', outcome_yes: 0.2, volume: 100, liquidity: 100,
    active: true, raw_data: { endDate: '2027-01-01', outcomes: '["No","Yes"]', outcomePrices: '[0.2,0.8]' },
  };
  assert.equal(currentBullishMarkets([{ ...row }])[0].outcome_yes, 0.8);
  assert.equal(currentBullishMarkets([{ ...row, date: '2026-10-01' }]).length, 0);
  assert.equal(currentBullishMarkets([{ ...row, active: false }]).length, 0);
  assert.equal(currentBullishMarkets([{ ...row, raw_data: { ...row.raw_data, endDate: '2026-01-01' } }]).length, 0);
  assert.equal(currentBullishMarkets([{ ...row, raw_data: {} }]).length, 0);
  assert.equal(currentBullishMarkets([{ ...row, raw_data: { ...row.raw_data, closed: true } }]).length, 0);
  assert.equal(currentBullishMarkets([{ ...row, raw_data: { ...row.raw_data, active: false } }]).length, 0);
  assert.equal(currentBullishMarkets([{ ...row, liquidity: NaN }]).length, 0);
  assert.equal(currentBullishMarkets([{ ...row, liquidity: 0 }]).length, 1);
  assert.equal(currentBullishMarkets([{ ...row, active: false }, row]).length, 0, 'do not resurrect an older active snapshot');
});
