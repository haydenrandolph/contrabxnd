import test from 'node:test';
import assert from 'node:assert/strict';
import { scrapeLiquidity } from './scraper';

test('liquidity ingestion accepts numeric zero RRP, normalizes M2, rejects incomplete core', async t => {
  const oldKey = process.env.FRED_API_KEY;
  process.env.FRED_API_KEY = 'test-only';
  t.after(() => { if (oldKey === undefined) delete process.env.FRED_API_KEY; else process.env.FRED_API_KEY = oldKey; });
  t.mock.method(Date, 'now', () => Date.parse('2026-11-08T12:00:00Z'));
  let missingRrp = false;
  t.mock.method(globalThis, 'fetch', async (input: string) => {
    const url = new URL(input);
    let payload: unknown;
    if (url.hostname.includes('fiscaldata')) {
      payload = { data: [{ record_date: '2026-11-06', open_today_bal: '800000' }] };
    } else if (url.pathname.includes('/rp/')) {
      payload = { repo: { operations: missingRrp ? [] : [{
        operationType: 'Reverse Repo', operationDate: '2026-11-06',
        settlementDate: '2026-11-06', maturityDate: '2026-11-09', totalAmtAccepted: 0,
      }] } };
    } else if (url.pathname.includes('/rates/')) {
      payload = { refRates: [{ type: 'SOFR', effectiveDate: '2026-11-06', percentRate: '4' }] };
    } else {
      const series = url.searchParams.get('series_id');
      payload = { observations: [{ date: series === 'M2SL' ? '2026-10-01' : '2026-11-04',
        value: series === 'M2SL' ? '22000' : '6000000' }] };
    }
    return Response.json(payload);
  });
  const snapshot = await scrapeLiquidity();
  assert.equal(snapshot.reverse_repo, 0);
  assert.equal(snapshot.net_liquidity, 5_200_000);
  assert.equal(snapshot.m2, 22_000_000);
  missingRrp = true;
  await assert.rejects(scrapeLiquidity(), /snapshot rejected/);
});
