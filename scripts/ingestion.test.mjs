import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const now = Date.parse('2026-11-09T12:00:00Z');
class Clock extends Date {
  constructor(...args) { super(...(args.length ? args : [now])); }
  static now() { return now; }
}
const secret = 'PRIVATE-provider-url-api-key-database-details';
const request = () => new Request('https://example.test', { headers: { authorization: 'Bearer test' } });
const routes = ['backfill', 'etf-scrape', 'liquidity-scrape', 'slr-scrape', 'polymarket-scrape', 'fedwatch-scrape', 'analyst-predict', 'market-brief'];
const method = name => name === 'backfill' ? 'POST' : 'GET';
const snapshot = {
  date: '2026-11-09', net_liquidity: 5_000_000, reverse_repo: 0,
  leverage_subindex: -0.2, tier1_leverage_capital: 9, policy_signal: null,
  meetings: [], target_lower: 3.5, target_upper: 3.75,
};
const etfs = ['ARKB', 'IBIT'].map(ticker => ({ ticker, date: '2026-11-09' }));
const predictions = ['price', 'macro', 'sentiment'].map(category => ({
  text: `Verifiable ${category} threshold`, confidence: 0.7, category,
  targetDate: '2026-11-10T12:00:00Z',
}));
const brief = { headline: 'Market brief', summary: 'Summary', sections: [{ title: 'Macro', body: 'Analysis' }] };

function database(run = q => ({ data: q.table === 'agents' ? { id: 'analyst' }
  : q.op === 'insert' ? q.rows.map((row, i) => ({ ...row, id: `prediction-${i}` })) : null }), rpc) {
  const calls = [];
  const rpcCalls = [];
  const leases = new Map();
  const client = { async rpc(name, args) {
    rpcCalls.push({ name, args });
    if (rpc) return rpc(name, args, rpcCalls);
    const key = `${args.p_job}/${args.p_day}`;
    const lease = leases.get(key);
    if (name === 'claim_ai_job') {
      if (lease && lease.status !== 'failed') return { data: { status: lease.status === 'completed' ? 'completed' : 'busy' } };
      const token = `claim-${rpcCalls.length}`;
      leases.set(key, { status: 'running', token });
      return { data: { status: 'claimed', token } };
    }
    assert.equal(name, 'finish_ai_job');
    if (lease?.status !== 'running' || lease.token !== args.p_token) return { data: false };
    lease.status = args.p_completed ? 'completed' : 'failed';
    return { data: true };
  }, from(table) {
    const q = { table, op: 'read' };
    const query = {};
    for (const name of ['select', 'eq', 'is', 'gte', 'lt', 'single', 'maybeSingle']) {
      query[name] = () => query;
    }
    query.or = filter => { q.or = filter; return query; };
    for (const op of ['insert', 'upsert']) {
      query[op] = (rows, options) => { Object.assign(q, { op, rows, options }); return query; };
    }
    query.then = (resolve, reject) => {
      calls.push(q);
      return Promise.resolve().then(() => run(q, calls)).then(resolve, reject);
    };
    return query;
  } };
  return { client, calls, rpcCalls, leases };
}

// Run the actual TypeScript route bodies. No real service clients, SDKs or network.
function harness(name, { db = database(), scrape = async () => snapshot, fetch = async () => Response.json({}),
  generate, env = {}, admin = () => db.client } = {}) {
  let generations = 0;
  const deadlines = [];
  const signals = [];
  const logs = [];
  const bindings = {
    Date: Clock,
    process: { env: { CRON_SECRET: 'test', FRED_API_KEY: 'test', ANTHROPIC_API_KEY: 'test', ...env } },
    AbortSignal: {
      any: signals => AbortSignal.any(signals),
      timeout(ms) { deadlines.push(ms); const signal = AbortSignal.timeout(ms); signals.push(signal); return signal; },
    },
    fetch,
    console: { error: (...args) => logs.push(args) },
  };
  const mocks = {
    'next/server': { NextResponse: Response },
    '@/lib/supabase/server': { createAdminClient: admin },
    '@/lib/etf/scrapers': { scrapeAll: scrape },
    '@/lib/liquidity/scraper': { scrapeLiquidity: scrape },
    '@/lib/slr/scraper': { scrapeSlr: scrape },
    '@/lib/polymarket/scraper': { scrapePolymarket: scrape },
    '@/lib/fedwatch/scraper': { scrapeFedWatch: scrape },
    '@/lib/agent-credit': { hashPrediction: () => 'hash' },
    '@anthropic-ai/sdk': class {
      constructor(options) {
        assert.equal(options.timeout, 10_000);
        assert.equal(options.maxRetries, 0);
      }
      messages = { create: async (_body, options) => {
        assert.ok(options.signal instanceof AbortSignal);
        generations++;
        const value = generate ? await generate() : name === 'market-brief' ? brief : predictions;
        return { content: [{ type: 'text', text: JSON.stringify(value).slice(1) }] };
      } };
    },
  };
  function load(file) {
    const code = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const record = { exports: {} };
    new Function('require', 'module', 'exports', ...Object.keys(bindings), code)(
      id => Object.hasOwn(mocks, id) ? mocks[id] : require(id), record, record.exports, ...Object.values(bindings),
    );
    return record.exports;
  }
  mocks['@/lib/audit-guards'] = load('lib/audit-guards.ts');
  mocks['@/lib/job-lease'] = load('lib/job-lease.ts');
  const route = load(`app/api/cron/${name}/route.ts`);
  return { call: (req = request()) => route[method(name)](req), db, deadlines, signals, logs, generations: () => generations };
}

async function failure(response, harness, status = 503) {
  assert.equal(response.status, status);
  const body = await response.json();
  assert.equal(JSON.stringify({ body, logs: harness.logs }).includes(secret), false);
  return body;
}

function assertLeaseFinished(harness, completed) {
  const [claim, finish] = harness.db.rpcCalls;
  assert.equal(harness.db.rpcCalls.length, 2);
  assert.equal(claim.name, 'claim_ai_job');
  assert.equal(claim.args.p_day, '2026-11-09');
  assert.equal(finish.name, 'finish_ai_job');
  assert.deepEqual(finish.args, { ...claim.args, p_token: 'claim-1', p_completed: completed });
  assert.equal(harness.db.leases.get(`${claim.args.p_job}/${claim.args.p_day}`).status, completed ? 'completed' : 'failed');
}

for (const name of routes) {
  test(`${name}: guards deny before admin creation`, async () => {
    for (const [env, status] of [[{}, 401], [{ CRON_SECRET: '' }, 503]]) {
      const h = harness(name, { env, admin() { assert.fail('unauthorized database access'); } });
      assert.equal((await h.call(new Request('https://example.test'))).status, status);
    }
  });
  test(`${name}: client construction failures are caught and redacted`, async () => {
    const h = harness(name, { admin() { throw new Error(secret); } });
    await failure(await h.call(), h);
  });
}

for (const name of ['liquidity-scrape', 'slr-scrape', 'polymarket-scrape', 'fedwatch-scrape']) {
  test(`${name}: failed scraper never writes or leaks details`, async () => {
    const h = harness(name, { scrape: async () => { throw new Error(secret); } });
    await failure(await h.call(), h);
    assert.equal(h.db.calls.length, 0);
  });
  test(`${name}: returned and thrown writes fail closed`, async () => {
    for (const throws of [false, true]) {
      const db = database(() => { if (throws) throw new Error(secret); return { error: { message: secret } }; });
      const h = harness(name, { db, scrape: async () => name === 'polymarket-scrape' ? [snapshot] : snapshot });
      await failure(await h.call(), h);
      assert.equal(db.calls.length, 1);
    }
  });
  test(`${name}: validated snapshots store successfully`, async () => {
    const h = harness(name, { scrape: async () => name === 'polymarket-scrape' ? [snapshot] : snapshot });
    assert.equal((await h.call()).status, 200);
    assert.equal(h.db.calls[0].op, 'upsert');
    if (name === 'slr-scrape') assert.equal(h.db.calls[0].rows.policy_signal, null);
    if (name === 'liquidity-scrape') assert.equal(h.db.calls[0].rows.reverse_repo, 0);
  });
}

test('ETF: full, partial, empty and thrown scrape outcomes', async () => {
  for (const [snapshots, status, stored] of [[etfs, 200, 2], [[etfs[0]], 503, 1], [[], 503, 0]]) {
    const h = harness('etf-scrape', { scrape: async () => snapshots });
    const response = await h.call();
    assert.equal(response.status, status);
    const body = await response.json();
    assert.equal(body.stored, stored);
    assert.equal(body.failed, 2 - stored);
  }
  const h = harness('etf-scrape', { scrape: async () => { throw new Error(secret); } });
  await failure(await h.call(), h);
});

test('ETF: partial/all write failures return 503 with accurate stored counts', async () => {
  for (const throws of [false, true]) {
    for (const all of [false, true]) {
      const db = database(q => {
        if (!all && q.rows.ticker === 'ARKB') return {};
        if (throws) throw new Error(secret);
        return { error: { message: secret } };
      });
      const h = harness('etf-scrape', { db, scrape: async () => etfs });
      const body = await failure(await h.call(), h);
      assert.equal(body.stored, all ? 0 : 1);
      assert.equal(body.failed, all ? 2 : 1);
      assert.equal(db.calls.length, 2);
    }
  }
});

const series = {
  WALCL: [{ date: '2021-12-29', value: '8000000' }],
  WRESBAL: [{ date: '2021-12-29', value: '3000000' }],
  M2SL: [{ date: '2021-12-01', value: '21000.5' }],
  WTREGEN: [{ date: '2021-12-29', value: '500000' }],
  NFCILEVERAGE: [{ date: '2022-01-07', value: '-0.25' }, { date: '2022-04-08', value: '-0.1' }],
  QBPBSLEVK: [{ date: '2021-10-01', value: '9.1' }, { date: '2022-04-01', value: '9.2' }],
};
function historyFetch(overrides = {}) {
  return async (url, options) => {
    assert.ok(options.signal instanceof AbortSignal);
    const id = new URL(url).searchParams.get('series_id');
    if (id) return Response.json({ observations: (overrides.series || series)[id] });
    if (overrides.rrpFailure) return new Response(secret, { status: 500 });
    return Response.json({ repo: { operations: [
      { operationDate: '2022-01-03', totalAmtAccepted: '0' },
      { operationDate: '2022-01-04', totalAmtAccepted: '2000000000' },
    ] } });
  };
}

test('backfill: M2 billions to millions, zero RRP, net liquidity and quarterly forward fills', async () => {
  const h = harness('backfill', { fetch: historyFetch() });
  assert.equal((await h.call()).status, 200);
  const [liquidity, slr] = h.db.calls.map(q => q.rows);
  assert.equal(liquidity[0].m2, 21_000_500);
  assert.equal(liquidity[0].reverse_repo, 0);
  assert.equal(liquidity[0].net_liquidity, 7_500_000);
  assert.equal(liquidity[1].reverse_repo, 2_000);
  assert.equal(liquidity[1].net_liquidity, 7_498_000);
  assert.deepEqual(slr.map(row => row.tier1_leverage_capital), [9.1, 9.2]);
  assert.ok(slr.every(row => row.policy_signal === null));
  assert.deepEqual(h.deadlines, Array(7).fill(10_000));
});

test('backfill: missing/invalid provider data never overwrites existing snapshots', async () => {
  for (const overrides of [{ rrpFailure: true }, { series: { ...series, M2SL: [] } },
    ...['NaN', 'Infinity', '', null, '-1'].map(value => ({ series: { ...series, M2SL: [{ date: '2021-12-01', value }] } })),
  ]) {
    const h = harness('backfill', { fetch: historyFetch(overrides) });
    assert.equal((await failure(await h.call(), h)).success, false);
    assert.equal(h.db.calls.length, 0);
  }
});

test('backfill: partial batch failures return 503 with successful row counts only', async () => {
  for (const table of ['liquidity_snapshots', 'slr_snapshots']) {
    const db = database(q => q.table === table ? { error: { message: secret } } : {});
    const h = harness('backfill', { db, fetch: historyFetch() });
    const body = await failure(await h.call(), h);
    assert.equal(body.success, false);
    assert.equal(body.stats.liquidity_rows, table === 'liquidity_snapshots' ? 0 : 2);
    assert.equal(body.stats.slr_rows, table === 'slr_snapshots' ? 0 : 2);
  }
});

test('backfill: later failed/thrown batches retain accurate committed counts', async () => {
  for (const throws of [false, true]) {
    const db = database((q, calls) => {
      if (calls.length === 2) {
        if (throws) throw new Error(secret);
        return { error: { message: secret } };
      }
      return {};
    });
    const fetch = async (url, options) => {
      if (new URL(url).searchParams.has('series_id')) return historyFetch()(url, options);
      return Response.json({ repo: { operations: Array.from({ length: 501 }, (_, i) => ({
        operationDate: new Date(Date.parse('2022-01-03') + i * 86400000).toISOString().slice(0, 10),
        totalAmtAccepted: '0',
      })) } });
    };
    const h = harness('backfill', { db, fetch });
    const body = await failure(await h.call(), h);
    assert.equal(body.success, false);
    assert.equal(body.stats.liquidity_rows, 500);
    assert.equal(body.stats.slr_rows, throws ? 0 : 2);
  }
});

for (const name of ['analyst-predict', 'market-brief']) {
  test(`${name}: pre-generation reads fail closed on returned/thrown errors`, async () => {
    for (const throws of [false, true]) {
      const h = harness(name, { db: database(() => {
        if (throws) throw new Error(secret);
        return { error: { message: secret } };
      }) });
      await failure(await h.call(), h);
      assert.equal(h.generations(), 0);
      assertLeaseFinished(h, false);
    }
  });
  test(`${name}: internal HTTP errors and aborts are caught before AI spend`, async () => {
    for (const throws of [false, true]) {
      const h = harness(name, { fetch: async (_url, options) => {
        assert.ok(options.signal instanceof AbortSignal);
        if (throws) throw new DOMException(secret, 'TimeoutError');
        return new Response(secret, { status: 503 });
      } });
      await failure(await h.call(), h);
      assert.equal(h.generations(), 0);
      assert.ok(h.deadlines.every(ms => ms === 10_000));
      assert.equal(h.deadlines.length, name === 'market-brief' ? 8 : 7);
      assertLeaseFinished(h, false);
    }
  });
  test(`${name}: generation failures are redacted and cannot write`, async () => {
    const h = harness(name, { generate: async () => { throw new Error(secret); } });
    await failure(await h.call(), h);
    assert.ok(h.db.calls.every(q => q.op === 'read'));
    assertLeaseFinished(h, false);
  });
  test(`${name}: returned/thrown insertion failures cannot report success`, async () => {
    for (const throws of [false, true]) {
      const db = database(q => {
        if (q.op !== 'read') {
          if (throws) throw new Error(secret);
          return { error: { message: secret } };
        }
        return { data: q.table === 'agents' ? { id: 'analyst' } : null };
      });
      const h = harness(name, { db });
      await failure(await h.call(), h);
      assert.equal(h.generations(), 1);
      assertLeaseFinished(h, false);
    }
  });
  test(`${name}: successful generation stores and reports success`, async () => {
    const h = harness(name);
    const response = await h.call();
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, name === 'market-brief' ? 'generated' : 'predicted');
    assert.equal(h.generations(), 1);
    assertLeaseFinished(h, true);
    const writes = h.db.calls.filter(q => q.op !== 'read');
    assert.equal(writes.length, 1);
    if (name === 'analyst-predict') {
      assert.equal(body.predictions.length, 3);
      assert.equal(writes[0].rows.length, 3);
      assert.deepEqual(writes[0].rows.map(row => row.job_slot), [0, 1, 2]);
      assert.ok(writes[0].rows.every(row => row.job_day === '2026-11-09'));
      const lookup = h.db.calls.find(q => q.table === 'agent_predictions' && q.op === 'read');
      assert.equal(lookup.or, 'job_day.eq.2026-11-09,and(job_day.is.null,submitted_at.gte.2026-11-09T00:00:00Z,submitted_at.lt.2026-11-10T00:00:00.000Z)');
    } else {
      assert.equal(writes[0].rows.date, '2026-11-09');
      assert.deepEqual(writes[0].options, { onConflict: 'date' });
    }
    const repeat = await h.call();
    assert.equal((await repeat.json()).status, name === 'market-brief' ? 'already_exists' : 'already_predicted');
    assert.equal(h.generations(), 1, 'completed lease must prevent another paid call');
    assert.equal(h.db.calls.filter(q => q.op !== 'read').length, 1);
  });

  test(`${name}: claim failures and malformed results fail preflight without any work`, async () => {
    for (const result of ['throw', { error: { message: secret } }, { data: null },
      { data: {} }, { data: { status: 'claimed' } }, { data: { status: 'claimed', token: '' } }]) {
      const db = database(undefined, async () => { if (result === 'throw') throw new Error(secret); return result; });
      const h = harness(name, { db, fetch: () => assert.fail('no fetch before claim') });
      const body = await failure(await h.call(), h);
      assert.match(body.error, /migration 015/);
      assert.equal(h.generations(), 0);
      assert.equal(db.calls.length, 0);
      assert.deepEqual(db.rpcCalls, [{ name: 'claim_ai_job', args: { p_job: name, p_day: '2026-11-09' } }]);
    }
  });

  test(`${name}: active or completed leases skip both lookup and generation`, async () => {
    for (const status of ['busy', 'completed']) {
      const db = database(undefined, async () => ({ data: { status } }));
      const h = harness(name, { db, fetch: () => assert.fail('no fetch for existing lease') });
      const response = await h.call();
      assert.equal(response.status, status === 'busy' ? 202 : 200);
      assert.equal((await response.json()).status, status === 'busy' ? 'in_progress' : name === 'market-brief' ? 'already_exists' : 'already_predicted');
      assert.equal(h.generations(), 0);
      assert.equal(db.calls.length, 0);
      assert.equal(db.rpcCalls.length, 1, 'a skipped worker must not finish another worker\'s lease');
    }
  });

  test(`${name}: finish failure after output never reports success or marks paid work failed`, async () => {
    for (const result of ['throw', { error: { message: secret } }, { data: false }]) {
      const db = database(undefined, async rpc => {
        if (rpc === 'claim_ai_job') return { data: { status: 'claimed', token: 'claim-1' } };
        if (result === 'throw') throw new Error(secret);
        return result;
      });
      const h = harness(name, { db });
      await failure(await h.call(), h);
      assert.equal(h.generations(), 1);
      assert.equal(db.calls.filter(q => q.op !== 'read').length, 1);
      assert.equal(db.rpcCalls.length, 2);
      assert.deepEqual(db.rpcCalls[1], { name: 'finish_ai_job', args: {
        p_job: name, p_day: '2026-11-09', p_token: 'claim-1', p_completed: true,
      } });
    }
  });
}

test('analyst: batch insertion failure reports zero committed predictions and permits retry', async () => {
  let fail = true;
  const db = database(q => {
    if (q.op === 'insert') return fail ? { error: { message: secret } }
      : { data: q.rows.map((row, i) => ({ ...row, id: `p${i}` })) };
    return { data: q.table === 'agents' ? { id: 'analyst' } : null };
  });
  const h = harness('analyst-predict', { db });
  const body = await failure(await h.call(), h);
  assert.equal(body.stored, 0);
  assert.equal(body.total, 3);
  assert.equal(db.calls.filter(q => q.op === 'insert').length, 1);
  assert.equal(db.calls.find(q => q.op === 'insert').rows.length, 3);
  assertLeaseFinished(h, false);
  fail = false;
  const retry = await h.call();
  assert.equal(retry.status, 200);
  assert.equal((await retry.json()).predictions.length, 3);
  assert.equal(h.generations(), 2);
  assert.equal(db.rpcCalls.at(-1).args.p_completed, true);
});

test('analyst: missing or incomplete batch results and failed daily reads cannot report success', async () => {
  for (const [readFailure, data] of [[true, null], [false, null], [false, []],
    [false, [{ id: 'p0' }]], [false, [{ id: 'p0' }, { id: 'p1' }]]]) {
    const db = database(q => {
      if (q.table === 'agents') return { data: { id: 'analyst' } };
      if (q.op === 'read') return readFailure ? { error: { message: secret } } : { data: [] };
      return { data, error: null };
    });
    const h = harness('analyst-predict', { db });
    const body = await failure(await h.call(), h);
    assert.equal(body.stored, 0);
    assert.equal(h.generations(), readFailure ? 0 : 1);
    assertLeaseFinished(h, false);
  }
});

test('analyst: agent/credit registration writes must succeed before generation', async () => {
  for (const failedTable of ['agents', 'agent_credit_scores']) {
    const db = database(q => {
      if (q.op === 'read') return { data: null };
      return q.table === failedTable ? { error: { message: secret } } : { data: { id: 'analyst' } };
    });
    const h = harness('analyst-predict', { db });
    const response = await h.call();
    assert.ok(response.status >= 500);
    assert.equal(JSON.stringify(await response.json()).includes(secret), false);
    assert.equal(h.generations(), 0);
    assertLeaseFinished(h, false);
  }
});

test('analyst: invalid generated predictions are rejected before any writes', async () => {
  for (const generated of [[], [predictions[0]], [...predictions.slice(0, 2), { ...predictions[2], targetDate: 'invalid' }]]) {
    const h = harness('analyst-predict', { generate: async () => generated });
    await failure(await h.call(), h, 502);
    assert.ok(h.db.calls.every(q => q.op === 'read'));
    assertLeaseFinished(h, false);
  }
});

test('market brief: malformed output is rejected before storage', async () => {
  const h = harness('market-brief', { generate: async () => ({ headline: 'Missing sections' }) });
  await failure(await h.call(), h, 502);
  assert.ok(h.db.calls.every(q => q.op === 'read'));
  assertLeaseFinished(h, false);
});
