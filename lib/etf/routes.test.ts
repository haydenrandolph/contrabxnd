import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';
import { FOMC_DATES } from '../fedwatch/calendar';

// Execute route handlers with an isolated module cache and no database connection.
function loader(mocks: Record<string, unknown>) {
  const require = createRequire(resolve('package.json'));
  const cache = new Map();
  function load(file: string) {
    const absolute = resolve(file);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const record = { exports: {} };
    cache.set(absolute, record);
    const source = ts.transpileModule(readFileSync(absolute, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const localRequire = (specifier: string) => {
      if (specifier in mocks) return mocks[specifier];
      if (specifier.startsWith('@/')) return load(`${specifier.slice(2)}.ts`);
      if (specifier.startsWith('.')) return load(`${resolve(dirname(absolute), specifier)}.ts`);
      return require(specifier);
    };
    new Function('require', 'exports', 'module', source)(localRequire, record.exports, record);
    return record.exports;
  }
  return load;
}

test('public and versioned ETF routes reject invalid persisted assets without manufacturing a net flow', async t => {
  t.mock.method(Date, 'now', () => Date.parse('2026-11-08T12:00:00Z'));
  const snapshots = ['IBIT', 'ARKB'].flatMap(ticker => [
    { ticker, date: '2026-11-06', nav_per_share: 50, shares_outstanding: 11_000_000, total_net_assets: ticker === 'IBIT' ? 0 : 550_000_000 },
    { ticker, date: '2026-11-05', nav_per_share: 49, shares_outstanding: 10_000_000, total_net_assets: 490_000_000 },
  ]);
  const load = loader({
    '@/lib/supabase/server': { createAdminClient: () => ({ from: () => {
      let columns = '';
      const query = {
        select(value: string) { columns = value; return query; },
        order() { return query; }, limit() { return query; }, in() { return query; },
        then(callback: (value: unknown) => unknown) {
          return Promise.resolve({ data: columns === 'date' ? snapshots.map(({ date }) => ({ date })) : snapshots }).then(callback);
        },
      };
      return query;
    } }) },
    '@/lib/api-auth': { authenticateApiKey: async () => ({ ok: true }), apiResponse: (data: unknown) => Response.json(data) },
  });
  for (const file of ['app/api/etf-flows/route.ts', 'app/api/v1/etf-flows/route.ts']) {
    const { GET } = load(file) as { GET: (request: Request) => Promise<Response> };
    const data = await (await GET(new Request('https://example.test'))).json();
    assert.equal(data.netFlow, null);
    assert.equal(data.funds.find((fund: { ticker: string }) => fund.ticker === 'IBIT').flow, null);
    assert.equal(data.funds.find((fund: { ticker: string }) => fund.ticker === 'ARKB').flow, 50_000_000);
  }
});

test('Polymarket API weights labeled bullish Yes outcomes and excludes bearish questions', async t => {
  t.mock.method(Date, 'now', () => Date.parse('2026-11-08T12:00:00Z'));
  const base = { date: '2026-11-08', question: 'Reserve?', outcome_yes: 0.2, volume: 100, liquidity: 10, active: true,
    raw_data: { endDate: '2027-01-01', outcomes: '["No","Yes"]', outcomePrices: '[0.2,0.8]' } };
  const rows = [
    { ...base, date: '2026-11-09', market_id: '2', slug: 'bitcoin-below-50k' },
    { ...base, market_id: '1', slug: 'us-national-bitcoin-reserve-before-2027' },
  ];
  const load = loader({ '@/lib/supabase/server': { createAdminClient: () => ({ from: () => {
    const query = { select() { return query; }, order() { return query; }, limit: async () => ({ data: rows }) };
    return query;
  } }) } });
  const { GET } = load('app/api/polymarket/route.ts') as { GET: () => Promise<Response> };
  const data = await (await GET()).json();
  assert.equal(data.count, 1);
  assert.equal(data.markets[0].yes, 0.8);
  assert.equal(data.avg_bull_prob, 0.8);
  assert.equal(data.date, '2026-11-08');
});

test('calendar includes published early-2027 releases and explicitly estimated options expiries', async t => {
  const RealDate = Date;
  const now = RealDate.parse('2027-01-01T12:00:00Z');
  t.mock.method(globalThis, 'Date', class extends RealDate {
    constructor(value?: string | number) { super(value ?? now); }
    static now() { return now; }
  });
  const load = loader({ '@/lib/node/client': { nodeFetch: async () => ({ res: Response.json([]) }) } });
  const { GET } = load('app/api/calendar/route.ts') as { GET: () => Promise<Response> };
  const { events } = await (await GET()).json();
  for (const [type, date] of [
    ['jobs', '2027-01-08'], ['cpi', '2027-01-13'], ['fomc', '2027-01-27'],
    ['pce', '2027-01-28'], ['gdp', '2027-01-28'], ['options', '2027-01-29'],
  ]) {
    assert.ok(events.some((event: { type: string; date: string }) => event.type === type && event.date === date), `${type} ${date}`);
  }
  const options = events.find((event: { type: string }) => event.type === 'options');
  assert.match(options.title, /\(Est\.\)/);
  assert.match(options.detail, /verify venue holiday schedules/);
});

test('signal rechecks source freshness instead of reusing a previously sufficient composite', async t => {
  let now = Date.now();
  t.mock.method(Date, 'now', () => now);
  const date = new Date(now).toISOString().slice(0, 10);
  const previous = new Date(now - 86400000).toISOString().slice(0, 10);
  const meetingDate = FOMC_DATES.find(value => value > date);
  assert.ok(meetingDate);
  let stalePrice = false;
  const load = loader({
    '@/lib/hashrate': { getMiningIntelligence: async () => { throw new Error('No mining data'); } },
    '@/lib/price': { getBitcoinPrice: async () => ({ data: { price: 100000 }, stale: stalePrice }) },
    '@/lib/supabase/server': { createAdminClient: () => ({ from: (table: string) => {
      let columns = '';
      const result = () => {
        if (table === 'etf_snapshots') return { data: columns === 'date' ? [{ date }, { date: previous }] : ['IBIT', 'ARKB'].flatMap(ticker => [
          { ticker, date, nav_per_share: 50, shares_outstanding: 11_000_000, total_net_assets: 550_000_000 },
          { ticker, date: previous, nav_per_share: 49, shares_outstanding: 10_000_000, total_net_assets: 490_000_000 },
        ]) };
        if (table === 'fedwatch_snapshots') return { data: { date, meetings: [{
          meeting_date: meetingDate, current_rate_bps: 425, current_rate_upper_bps: 450,
          probabilities: [{ lower_bps: 425, upper_bps: 450, probability: 1 }],
          implied_rate: 4.375, cut_probability: 0, hold_probability: 1, hike_probability: 0,
        }] } };
        if (table === 'onchain_snapshots') return { data: { date, total_supply: 20_000_000, realized_cap: 1e12 } };
        return { data: null };
      };
      const query = {
        select(value: string) { columns = value; return query; }, order() { return query; },
        limit() { return query; }, in() { return query; },
        single: async () => result(), maybeSingle: async () => result(),
        then: (callback: (value: unknown) => unknown) => Promise.resolve(result()).then(callback),
      };
      return query;
    } }) },
  });
  t.mock.method(globalThis, 'fetch', async () => Response.json({ data: [{ value: '25', timestamp: String(now / 1000) }] }));
  const { GET } = load('app/api/signal/route.ts') as { GET: () => Promise<Response> };
  const fresh = await (await GET()).json();
  assert.equal(typeof fresh.score, 'number', JSON.stringify(fresh));
  assert.ok(fresh.components.mvrv);
  assert.ok(Math.abs(fresh.coverage - 0.52) < 1e-10);
  now += 3 * 60_000;
  stalePrice = true;
  const stale = await (await GET()).json();
  assert.equal(stale.components.mvrv, undefined);
  assert.equal(stale.score, null, 'remaining component weight is below minimum coverage');
});
