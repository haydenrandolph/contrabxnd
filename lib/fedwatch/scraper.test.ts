import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMeetingProbabilities } from './scraper';
import { FOMC_DATES } from './calendar';
import { validMeetingForecast } from './math';

for (const change of [-0.5, -0.375, -0.25, -0.125, 0, 0.125, 0.25, 0.375]) {
  test(`FedWatch brackets ${change * 100}bp on the target-lower grid`, () => {
    const start = 4.375;
    const post = start + change;
    // March 18 decision: 18 old-rate days, 13 new-rate days.
    const monthly = (18 * start + 13 * post) / 31;
    const result = calculateMeetingProbabilities('2026-03-18', start, monthly, null, 4.25);
    assert.ok(Math.abs(result.endRate - post) < 1e-10);
    assert.equal(result.probabilities.reduce((s, p) => s + p.probability, 0), 1);
    const expectedLower = result.probabilities.reduce((s, p) => s + p.lower_bps * p.probability, 0);
    assert.ok(Math.abs(expectedLower - (425 + change * 100)) < 1e-8);
    assert.ok(result.probabilities.every(p => p.upper_bps - p.lower_bps === 25));
  });
}

test('later meeting outcomes remain relative to current target, not prior expected target', () => {
  const current = 4.375;
  const prior = 4.125;
  const post = 4;
  const result = calculateMeetingProbabilities('2026-03-18', current, (18 * prior + 13 * post) / 31, prior, 4.25);
  assert.deepEqual(result.probabilities.map(p => [p.lower_bps, p.probability]), [[400, 0.5], [375, 0.5]]);
});

test('FedWatch rejects nonfinite and month-end underdetermined inputs', () => {
  assert.throws(() => calculateMeetingProbabilities('2026-03-18', 4.375, NaN, null));
  assert.throws(() => calculateMeetingProbabilities('2026-03-31', 4.375, 4, null));
});

test('verified FOMC calendar is unique, ordered, and extends through 2027', () => {
  assert.deepEqual(FOMC_DATES, [...new Set(FOMC_DATES)].sort());
  assert.ok(FOMC_DATES.includes('2026-04-29'));
  assert.ok(FOMC_DATES.includes('2026-12-09'));
  assert.equal(FOMC_DATES.filter(d => d.startsWith('2027')).length, 8);
});

test('forecast validation rejects stale rate semantics and malformed probabilities', () => {
  const result = calculateMeetingProbabilities('2026-03-18', 4.375, (18 * 4.375 + 13 * 4.25) / 31, null, 4.25);
  const meeting = {
    meeting_date: '2026-03-18', current_rate_bps: 425, current_rate_upper_bps: 450,
    probabilities: result.probabilities, implied_rate: result.endRate,
    cut_probability: 0.5, hold_probability: 0.5, hike_probability: 0,
  };
  assert.equal(validMeetingForecast(meeting), true);
  assert.equal(validMeetingForecast({ ...meeting, implied_rate: 4.375 }), false);
  assert.equal(validMeetingForecast({ ...meeting, cut_probability: 1 }), false);
  assert.equal(validMeetingForecast({ ...meeting, probabilities: [] }), false);
});
