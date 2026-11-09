import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const NOW = Date.parse('2026-11-09T12:00:00Z');
class Clock extends Date {
  constructor(...args) { super(...(args.length ? args : [NOW])); }
  static now() { return NOW; }
}

// Execute the actual routes and credit helper with only DB/auth/network boundaries stubbed.
function loader(mocks = {}) {
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    const code = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const record = { exports: {} };
    new Function('require', 'module', 'exports', 'Date', 'fetch', code)(name => {
      if (name in mocks) return mocks[name];
      if (name.startsWith('@/')) return load(`${name.slice(2)}.ts`);
      return require(name);
    }, record, record.exports, Clock, () => { throw new Error('Snapshot fetching is forbidden'); });
    cache.set(file, record.exports);
    return record.exports;
  }
  return load;
}

const iso = days => new Date(NOW + days * 86400000).toISOString();
const prediction = (id, overrides = {}) => ({
  id, agent_id: 'agent', prediction_text: 'BTC above $100,000 and fear below 20',
  category: 'price', confidence: 0.8, submitted_at: iso(-10), target_date: iso(-1),
  outcome: 'pending', resolved_at: null, resolution_note: null, agents: { owner_id: 'other' }, ...overrides,
});
const evidence = 'Source: archived exchange tick at the exact target UTC timestamp; observed BTC price was $101,000, above the stated $100,000 threshold.';

function database(rows = []) {
  const state = { rows, writes: [], calls: [], scoreError: false, historyError: false, agentError: false, updateError: false, countError: false, race: false };
  state.client = { from(table) {
    const q = { table, filters: [], orders: [], start: 0, end: Infinity, limit: Infinity };
    state.calls.push(q);
    const query = {
      select(columns, options) { q.columns = columns; q.count = options?.count; return query; },
      eq(key, value) { q.filters.push(row => row[key] === value); return query; },
      lt(key, value) { q.filters.push(row => row[key] < value); return query; },
      lte(key, value) { q.filters.push(row => row[key] <= value); return query; },
      order(key, options) { assert.equal(options.ascending, true); q.orders.push(key); return query; },
      limit(value) { q.limit = value; return query; },
      range(start, end) { q.start = start; q.end = end; return query; },
      update(value) { q.update = value; return query; },
      upsert(value) { q.upsert = value; return query; },
      single() { q.single = true; return query; },
      maybeSingle() { q.single = true; return query; },
      then(resolve, reject) {
        const error = message => ({ data: null, error: { message } });
        let result;
        if (table === 'agent_credit_scores') {
          state.writes.push(q.upsert);
          result = state.scoreError ? error('score write failed') : { data: null, error: null };
        } else if (table === 'agents') {
          result = state.agentError ? error('agent read failed') : { data: { created_at: iso(-100) }, error: null };
        } else {
          let selected = state.rows.filter(row => q.filters.every(filter => filter(row)));
          if (q.update) {
            if (state.updateError) result = error('update failed');
            else if (state.race) result = { data: null, error: null };
            else {
              selected.forEach(row => Object.assign(row, q.update));
              result = { data: selected[0] ? { id: selected[0].id } : null, error: null };
            }
          } else if ((state.historyError && q.columns.includes('confidence')) || (state.countError && q.count)) {
            result = error('read failed');
          } else {
            selected = [...selected].sort((a, b) => {
              for (const key of q.orders) {
                const order = String(a[key]).localeCompare(String(b[key]));
                if (order) return order;
              }
              return 0;
            });
            const count = selected.length;
            // Model PostgREST's maximum page size, including for unpaginated reads.
            selected = selected.slice(q.start, Math.min(q.end + 1, q.start + q.limit, q.start + 1000));
            result = { data: q.single ? selected[0] || null : selected, error: null, ...(q.count ? { count } : {}) };
          }
        }
        return Promise.resolve(result).then(resolve, reject);
      },
    };
    return query;
  } };
  return state;
}

function harness(db, { operator = true, user = 'operator', denied = null } = {}) {
  return loader({
    '@/lib/supabase/server': {
      createAdminClient: () => db.client,
      createClient: async () => ({ auth: { getUser: async () => ({ data: { user: user ? { id: user } : null } }) } }),
    },
    '@/lib/audit-guards': { isOperator: () => operator, cronGuard: () => denied },
  });
}
const request = body => new Request('https://example.test', { method: 'POST', body: JSON.stringify(body) });
const resolveBody = extra => ({ predictionId: 'p', outcome: 'correct', resolutionNote: evidence, ...extra });
const cronRequest = () => new Request('https://example.test');

test('cron authentication fails closed before accessing the database', async () => {
  const original = process.env.CRON_SECRET;
  const { GET } = loader({
    '@/lib/supabase/server': { createAdminClient() { assert.fail('No database access without cron authorization'); } },
  })('app/api/cron/resolve-predictions/route.ts');
  try {
    delete process.env.CRON_SECRET;
    assert.equal((await GET(cronRequest())).status, 503);
    process.env.CRON_SECRET = 'test-secret';
    assert.equal((await GET(cronRequest())).status, 401);
  } finally {
    if (original === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = original;
  }
});

test('cron quarantines all free-text categories and never fetches current snapshots', async () => {
  const rows = ['price', 'sentiment', 'general'].map(category => prediction(category, { category }));
  const db = database(rows);
  const { GET } = harness(db)('app/api/cron/resolve-predictions/route.ts');
  const response = await GET(cronRequest());
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.status, 'needs_review');
  assert.equal(body.needs_review, 3);
  assert.equal(body.awarded, 0);
  assert.ok(rows.every(row => row.outcome === 'pending'));
  assert.equal(db.writes.length, 0);
});

test('cron expires only strictly after two days, without determining correctness or credit', async () => {
  const db = database([
    prediction('old', { target_date: iso(-3) }),
    prediction('boundary', { target_date: iso(-2) }),
    prediction('future', { target_date: iso(1) }),
  ]);
  const response = await harness(db)('app/api/cron/resolve-predictions/route.ts').GET(cronRequest());
  const body = await response.json();
  assert.equal(body.expired, 1);
  assert.equal(body.pending_remaining, 1);
  assert.equal(db.rows[0].outcome, 'expired');
  assert.match(db.rows[0].resolution_note, /Outcome not determined; no credit awarded/);
  assert.equal(db.rows[1].outcome, 'pending');
  assert.equal(db.rows[2].outcome, 'pending');
  assert.equal(db.writes[0].volume, 0);
  assert.equal(db.writes[0].correct_predictions, 0);
  assert.equal(db.writes[0].composite_score, 0);
});

test('cron reports full backlog beyond the expiration batch and makes progress on subsequent runs', async () => {
  const db = database(Array.from({ length: 1107 }, (_, i) => prediction(String(i).padStart(4, '0'), { target_date: iso(-3) })));
  const { GET } = harness(db)('app/api/cron/resolve-predictions/route.ts');
  let body = await (await GET(cronRequest())).json();
  assert.equal(body.expired, 50);
  assert.equal(body.pending_remaining, 1057);
  assert.equal(body.review_ids.length, 50);
  assert.equal(body.review_ids_truncated, true);
  assert.equal(db.writes[0].total_predictions, 1107);
  body = await (await GET(cronRequest())).json();
  assert.equal(body.pending_remaining, 1007);
});

test('recent review rows do not starve older expiration work', async () => {
  const db = database([
    ...Array.from({ length: 100 }, (_, i) => prediction(`recent-${i}`)),
    prediction('old', { target_date: iso(-3) }),
  ]);
  const body = await (await harness(db)('app/api/cron/resolve-predictions/route.ts').GET(cronRequest())).json();
  assert.equal(body.expired, 1);
  assert.equal(body.pending_remaining, 100);
});

for (const failure of ['scoreError', 'historyError', 'agentError', 'updateError', 'countError']) {
  test(`cron reports ${failure} as incomplete, not success`, async () => {
    const db = database([prediction('p', { target_date: iso(-3) })]);
    db[failure] = true;
    const response = await harness(db)('app/api/cron/resolve-predictions/route.ts').GET(cronRequest());
    assert.equal(response.status, 503);
    assert.equal((await response.json()).status, 'incomplete');
  });
}

test('operator route denies unauthenticated, nonoperator and self-award requests', async () => {
  for (const [options, expected] of [[{ user: null }, 401], [{ operator: false }, 403], [{ user: 'other' }, 403]]) {
    const db = database([prediction('p')]);
    const response = await harness(db, options)('app/api/agents/resolve/route.ts').POST(request(resolveBody()));
    assert.equal(response.status, expected);
    assert.equal(db.rows[0].outcome, 'pending');
  }
});

test('operator route validates outcomes and requires substantive evidence notes', async () => {
  for (const extra of [
    { outcome: 'pending' }, { outcome: {} }, { outcome: 'CORRECT' },
    { resolutionNote: undefined }, { resolutionNote: '' }, { resolutionNote: 'Confirmed correct' },
    { resolutionNote: 'x'.repeat(100) }, { resolutionNote: 'x'.repeat(2001) },
  ]) {
    const db = database([prediction('p')]);
    const response = await harness(db)('app/api/agents/resolve/route.ts').POST(request(resolveBody(extra)));
    assert.equal(response.status, 400, JSON.stringify(extra));
    assert.equal(db.rows[0].outcome, 'pending');
  }
});

test('operator route rejects future, invalid and retroactive targets', async () => {
  for (const extra of [{ target_date: iso(1) }, { target_date: 'invalid' }, { target_date: iso(-11) }, { submitted_at: 'invalid' }]) {
    const db = database([prediction('p', extra)]);
    const response = await harness(db)('app/api/agents/resolve/route.ts').POST(request(resolveBody()));
    assert.equal(response.status, 400);
    assert.equal(db.writes.length, 0);
  }
});

test('operator resolves explicit outcomes with evidence and paginates the entire score history', async () => {
  for (const outcome of ['correct', 'incorrect', 'expired']) {
    const db = database([prediction('p'), ...Array.from({ length: 1200 }, (_, i) => prediction(`history-${i}`, { outcome: 'correct', resolved_at: iso(-1) }))]);
    const response = await harness(db)('app/api/agents/resolve/route.ts').POST(request(resolveBody({ outcome })));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).score_updated, true);
    assert.equal(db.rows[0].resolution_note, evidence);
    assert.equal(db.writes[0].total_predictions, 1201);
    assert.equal(db.writes[0].correct_predictions, outcome === 'correct' ? 1201 : 1200);
    const pages = db.calls.filter(call => call.columns?.startsWith('id, confidence'));
    assert.deepEqual(pages.map(page => page.start), [0, 500, 1000]);
    assert.ok(pages.every(page => page.orders.join(',') === 'submitted_at,id'));
  }
});

test('operator score failure returns 503 and identical retry repairs it without resolving again', async () => {
  const db = database([prediction('p')]);
  db.scoreError = true;
  const { POST } = harness(db)('app/api/agents/resolve/route.ts');
  let response = await POST(request(resolveBody()));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).score_updated, false);
  assert.equal(db.rows[0].outcome, 'correct');
  db.scoreError = false;
  response = await POST(request(resolveBody()));
  assert.equal(response.status, 200);
  assert.equal(db.calls.filter(call => call.update).length, 1);
  assert.equal((await POST(request(resolveBody({ outcome: 'incorrect' })))).status, 400);
});

test('operator accepts the shipped note field and handles compare-and-set conflicts', async () => {
  const db = database([prediction('p')]);
  db.race = true;
  const response = await harness(db)('app/api/agents/resolve/route.ts').POST(request(resolveBody({ resolutionNote: undefined, note: evidence })));
  assert.equal(response.status, 409);
  assert.equal(db.writes.length, 0);
});

test('history pagination includes exact page multiples and fails closed on a later page error', async () => {
  const { recomputeAgentCreditScore } = loader()('lib/agent-credit.ts');
  const rows = Array.from({ length: 1500 }, (_, i) => prediction(String(i), { outcome: 'correct', resolved_at: iso(-1) }));
  const db = database(rows);
  await recomputeAgentCreditScore(db.client, 'agent');
  assert.equal(db.writes[0].total_predictions, 1500);
  assert.deepEqual(db.calls.filter(call => call.columns?.startsWith('id, confidence')).map(call => call.start), [0, 500, 1000, 1500]);

  const failed = database(rows);
  const from = failed.client.from;
  failed.client.from = table => {
    const query = from(table);
    const range = query.range;
    query.range = (start, end) => {
      if (start >= 500) failed.historyError = true;
      return range(start, end);
    };
    return query;
  };
  await assert.rejects(recomputeAgentCreditScore(failed.client, 'agent'), /complete prediction history/);
  assert.equal(failed.writes.length, 0, 'Never write a score based on a truncated history');
});

test('credit consistency is chronological and independent of incoming database order', () => {
  const { computeCreditScore } = loader()('lib/agent-credit.ts');
  const rows = Array.from({ length: 30 }, (_, i) => prediction(String(i), {
    submitted_at: iso(-40 + i), resolved_at: iso(-1), outcome: i < 15 ? 'correct' : 'incorrect',
  }));
  const shuffled = rows.filter((_, i) => i % 2).concat(rows.filter((_, i) => !(i % 2))).reverse();
  assert.deepEqual(computeCreditScore(rows, iso(-100)), computeCreditScore(shuffled, iso(-100)));
  const score = computeCreditScore([prediction('expired', { outcome: 'expired' }), prediction('pending')], iso(-100));
  assert.equal(score.compositeScore, 0);
  assert.equal(score.volume, 0);
  assert.equal(score.correctPredictions, 0);
});
