import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateCandles, candleBucket, fetchCandles } from '../chart/candles';

test('weekly buckets start Monday UTC across Sunday and year boundaries', () => {
  const monday = Date.parse('2025-12-29T00:00:00Z') / 1000;
  assert.equal(candleBucket(Date.parse('2026-01-04T23:59:59Z') / 1000, '1w'), monday);
  assert.equal(candleBucket(Date.parse('2026-01-05T00:00:00Z') / 1000, '1w'), monday + 604800);
});

test('four-hour aggregation uses chronological OHLC and sums hourly volume', () => {
  const start = Date.parse('2026-11-08T00:00:00Z') / 1000;
  const hours = Array.from({ length: 5 }, (_, i) => ({
    time: start + i * 3600, open: 10 + i, high: 20 + i, low: 5 - i, close: 11 + i, volume: i + 1,
  }));
  assert.deepEqual(aggregateCandles(hours.reverse(), '4h'), [
    { time: start, open: 10, high: 23, low: 2, close: 14, volume: 10 },
    { time: start + 14400, open: 14, high: 24, low: 1, close: 15, volume: 5 },
  ]);
});

test('candle requests reuse stable windows within a cache period', async t => {
  let now = Date.parse('2026-11-08T12:00:01Z');
  t.mock.method(Date, 'now', () => now);
  const urls: string[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    urls.push(url);
    return new Response('[]', { headers: { 'Content-Type': 'application/json' } });
  });
  await fetchCandles('4h', 2);
  now += 5 * 60 * 1000;
  await fetchCandles('4h', 2);
  assert.equal(urls[0], urls[1]);
  assert.equal(new URL(urls[0]).searchParams.get('granularity'), '3600');
});
