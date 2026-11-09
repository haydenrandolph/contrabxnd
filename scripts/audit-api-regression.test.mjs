import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = resolve(dirname(new URL(import.meta.url).pathname), '..');

// Compile isolated modules with explicit dependency stubs, without a Next server or DB.
function loader(mocks = {}) {
  const cache = new Map();
  function load(file) {
    const absolute = resolve(root, file);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const record = { exports: {} };
    cache.set(absolute, record);
    const source = ts.transpileModule(readFileSync(absolute, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const localRequire = specifier => {
      if (specifier in mocks) return mocks[specifier];
      if (specifier.startsWith('@/')) {
        if ('*' in mocks) return mocks['*'];
        return load(`${specifier.slice(2)}.ts`);
      }
      if (specifier.startsWith('.')) return load(`${resolve(dirname(absolute), specifier)}.ts`);
      return require(specifier);
    };
    new Function('require', 'exports', 'module', source)(localRequire, record.exports, record);
    return record.exports;
  }
  return load;
}

const guards = loader()('lib/audit-guards.ts');

test('all cron handlers fail closed before invoking dependencies', async () => {
  const original = process.env.CRON_SECRET;
  try {
    const routes = readdirSync(resolve(root, 'app/api/cron'));
    assert.ok(routes.length >= 10);
    for (const route of routes) {
      const mod = loader({ '@/lib/audit-guards': guards, '*': {} })(`app/api/cron/${route}/route.ts`);
      const handler = mod.GET || mod.POST;
      delete process.env.CRON_SECRET;
      assert.equal((await handler(new Request('https://example.test', { headers: { authorization: 'Bearer undefined' } }))).status, 503, route);
      process.env.CRON_SECRET = '';
      assert.equal((await handler(new Request('https://example.test'))).status, 503, route);
      process.env.CRON_SECRET = 'actual-secret';
      assert.equal((await handler(new Request('https://example.test', { headers: { authorization: 'Bearer wrong' } }))).status, 401, route);
    }
    assert.equal(guards.cronGuard(new Request('https://example.test', { headers: { authorization: 'Bearer actual-secret' } })), null);
  } finally {
    if (original === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = original;
  }
});

test('script pushes are unsigned, bounded and complete', { timeout: 1000 }, () => {
  const { decodeScript } = loader()('lib/node/script.ts');
  for (const hex of ['4e00000080', '4effffffff', '4e', '4c', '4d01', '02aa', '4c02aa', '4d0200aa', '4e02000000aa', '0', 'gg', '00'.repeat(10001)]) {
    assert.equal(decodeScript(hex), null, hex.slice(0, 30));
  }
  assert.equal(decodeScript('4e01000000aa').asm, 'OP_PUSHDATA4 aa');
  assert.equal(decodeScript('4e0000000051').asm, 'OP_PUSHDATA4  OP_1');
  assert.equal(decodeScript('0014' + 'aa'.repeat(20)).type, 'v0_p2wpkh');
  assert.ok(decodeScript('00'.repeat(10000)));
});

test('history and MCP calendar contracts reject nonfinite, impossible and unbounded dates', () => {
  const now = Date.parse('2026-11-08T12:00:00Z') / 1000;
  for (const [from, to] of [[NaN, now], [Infinity, now], [-1, now], [1230940800, Infinity], [now, now], [1230940800.5, now], [1230940800, now + 1]]) {
    assert.equal(guards.validHistoryRange(from, to, now), false);
  }
  assert.equal(guards.validHistoryRange(1230940800, now, now), true);
  assert.equal(guards.historyRangeFromDates('2026-02-30', '2026-03-01', now), null);
  assert.equal(guards.historyRangeFromDates('2026-11-09', '2026-11-09', now), null);
  assert.equal(guards.historyRangeFromDates('2026-11-08', '2026-11-07', now), null);
  assert.deepEqual(guards.historyRangeFromDates('2026-11-08', '2026-11-08', now), { from: now - 43200, to: now });
});

test('prediction targets require real future dates', () => {
  const now = Date.parse('2026-01-01T00:00:00Z');
  for (const target of [null, 1, '', '2025-12-31', '2026-01-01', '2026-02-30', '2026-01-01T25:00:00Z', 'Infinity']) {
    assert.equal(guards.validPredictionTarget(target, now), false, String(target));
  }
  assert.equal(guards.validPredictionTarget('2026-02-01T00:00:00Z', now), true);
});

test('nearby coordinates and radius must be finite and within bounds', () => {
  for (const values of [[NaN, 0, 100], [0, Infinity, 100], [91, 0, 100], [0, -181, 100], [0, 0, 0], [0, 0, -1], [0, 0, Infinity], [0, 0, 20001]]) {
    assert.equal(guards.validNearbyLocation(...values), false);
  }
  assert.equal(guards.validNearbyLocation(0, 0, 100), true);
  assert.equal(guards.validNearbyLocation(-90, 180, 20000), true);
});

test('nearby queries reuse one global snapshot and country cache has a fixed bound', async () => {
  const originalFetch = globalThis.fetch;
  const originalLog = console.log;
  let globalCalls = 0;
  let firstCountryCalls = 0;
  globalThis.fetch = async url => {
    if (url.includes('/elements?')) {
      globalCalls++;
      return Response.json([2, 0, 1].map((lon, id) => ({
        id: String(id), osm_json: { lat: 0, lon, tags: { name: `Branch ${id}` } }, tags: {}, deleted_at: '',
      })));
    }
    if (url.endsWith('/areas/aa')) firstCountryCalls++;
    return Response.json({ tags: { type: 'country', geo_json: { type: 'Polygon', coordinates: [[[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]]] } } });
  };
  console.log = () => {};
  try {
    const { fetchBTCMapBusinesses, fetchBusinessesNearLocation } = loader()('lib/network/btcmap.ts');
    assert.deepEqual((await fetchBusinessesNearLocation(0, 0, 150)).map(b => b.id), ['btcmap-1', 'btcmap-2']);
    await Promise.all(Array.from({ length: 40 }, (_, i) => fetchBusinessesNearLocation(i / 1000, 0, 150)));
    assert.equal(globalCalls, 1);
    for (let i = 0; i < 40; i++) {
      await fetchBTCMapBusinesses(String.fromCharCode(97 + Math.floor(i / 26)) + String.fromCharCode(97 + i % 26));
    }
    await fetchBTCMapBusinesses('aa');
    assert.equal(firstCountryCalls, 2, 'old country result was evicted');
    assert.equal(globalCalls, 1, 'country cache cannot evict the global snapshot');
    await assert.rejects(fetchBTCMapBusinesses('arbitrary-country'));
    await assert.rejects(fetchBusinessesNearLocation(NaN, 0, 100));
  } finally {
    globalThis.fetch = originalFetch;
    console.log = originalLog;
  }
});

function keyAdmin() {
  return { from() {
    const query = {
      select() { return query; }, eq() { return query; }, update() { return query; },
      single: async () => ({ data: { user_id: 'ordinary-user', revoked_at: null, tier: 'free' }, error: null }),
      then: callback => Promise.resolve({}).then(callback),
    };
    return query;
  } };
}

test('REST and MCP use the same API-key quota; invoices have a separate shared quota', async () => {
  const backend = process.env.RATE_LIMIT_BACKEND;
  delete process.env.RATE_LIMIT_BACKEND;
  try {
    const { authenticateApiKey, limitInvoiceCreation } = loader({ '@/lib/supabase/server': { createAdminClient: keyAdmin } })('lib/api-auth.ts');
    const key = 'cbx_regression';
    for (let i = 0; i < 60; i++) {
      const request = new Request('https://example.test', { headers: i % 2 ? { authorization: `Bearer ${key}` } : { 'x-api-key': key } });
      assert.equal((await authenticateApiKey(request, i % 2 ? 'bearer' : 'header')).ok, true);
    }
    const auth = await authenticateApiKey(new Request('https://example.test', { headers: { authorization: `Bearer ${key}` } }), 'bearer');
    assert.equal(auth.ok, false);
    assert.equal(auth.response.status, 429);
    for (let i = 0; i < 10; i++) assert.equal(await limitInvoiceCreation('user:test'), null);
    assert.equal((await limitInvoiceCreation('user:test')).status, 429);
  } finally {
    if (backend === undefined) delete process.env.RATE_LIMIT_BACKEND;
    else process.env.RATE_LIMIT_BACKEND = backend;
  }
});

test('configured distributed limiter fails closed on missing or malformed RPC', async () => {
  const backend = process.env.RATE_LIMIT_BACKEND;
  process.env.RATE_LIMIT_BACKEND = 'supabase';
  try {
    for (const result of [{ error: { message: 'Missing RPC' }, data: null }, { error: null, data: [{ allowed: true, remaining: -1, reset_at: 'invalid' }] }]) {
      const { enforceRateLimit } = loader({ '@/lib/supabase/server': { createAdminClient: () => ({ rpc: async () => result }) } })('lib/api-auth.ts');
      assert.equal((await enforceRateLimit('test', 60, 3600000)).status, 503);
    }
  } finally {
    if (backend === undefined) delete process.env.RATE_LIMIT_BACKEND;
    else process.env.RATE_LIMIT_BACKEND = backend;
  }
});

test('ordinary prediction owners cannot resolve or award themselves credit', async () => {
  const operators = process.env.OPERATOR_USER_IDS;
  process.env.OPERATOR_USER_IDS = 'someone-else';
  try {
    const { POST } = loader({ '@/lib/supabase/server': {
      createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) } }),
      createAdminClient() { assert.fail('must deny before accessing database'); },
    } })('app/api/agents/resolve/route.ts');
    const response = await POST(new Request('https://example.test', { method: 'POST', body: JSON.stringify({ predictionId: 'id', outcome: 'correct' }) }));
    assert.equal(response.status, 403);
  } finally {
    if (operators === undefined) delete process.env.OPERATOR_USER_IDS;
    else process.env.OPERATOR_USER_IDS = operators;
  }
});

test('operator status does not permit self-awarded prediction credit', async () => {
  const operators = process.env.OPERATOR_USER_IDS;
  process.env.OPERATOR_USER_IDS = 'operator-owner';
  try {
    const { POST } = loader({ '@/lib/supabase/server': {
      createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'operator-owner' } } }) } }),
      createAdminClient: () => ({ from() {
        const query = {
          select() { return query; }, eq() { return query; },
          single: async () => ({ data: { id: 'prediction', agents: { owner_id: 'operator-owner' }, outcome: 'pending' } }),
          update() { assert.fail('operators must not update their own predictions'); },
        };
        return query;
      } }),
    } })('app/api/agents/resolve/route.ts');
    assert.equal((await POST(new Request('https://example.test', { method: 'POST', body: JSON.stringify({ predictionId: 'prediction', outcome: 'correct' }) }))).status, 403);
  } finally {
    if (operators === undefined) delete process.env.OPERATOR_USER_IDS;
    else process.env.OPERATOR_USER_IDS = operators;
  }
});

test('prediction submission owns timestamps and outcomes and rejects nonnumeric confidence', async () => {
  let inserted;
  const { POST } = loader({ '@/lib/supabase/server': {
    createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) } }),
    createAdminClient: () => ({ from(table) {
      const query = {
        select() { return query; }, eq() { return query; },
        insert(value) { inserted = value; return query; },
        single: async () => ({ data: table === 'agents' ? { id: 'agent', owner_id: 'owner' } : inserted, error: null }),
      };
      return query;
    } }),
  } })('app/api/agents/predictions/route.ts');
  const input = {
    agentId: 'agent', predictionText: 'BTC above $100,000', confidence: 0.8,
    targetDate: new Date(Date.now() + 86400000).toISOString(),
    submitted_at: '2009-01-03T00:00:00Z', outcome: 'correct',
  };
  const before = Date.now();
  assert.equal((await POST(new Request('https://example.test', { method: 'POST', body: JSON.stringify(input) }))).status, 201);
  assert.equal(inserted.outcome, 'pending');
  assert.ok(Date.parse(inserted.submitted_at) >= before);
  assert.ok(Date.parse(inserted.submitted_at) <= Date.now());
  assert.equal((await POST(new Request('https://example.test', { method: 'POST', body: JSON.stringify({ ...input, confidence: '0.8' }) }))).status, 400);
  assert.equal((await POST(new Request('https://example.test', { method: 'POST', body: JSON.stringify({ ...input, targetDate: '2020-01-01' }) }))).status, 400);
});

test('versioned registration enforces the ten-active-agent cap and fails closed on count errors', async () => {
  for (const [count, error, status] of [[10, null, 400], [null, { message: 'Database unavailable' }, 503]]) {
    const { POST } = loader({
      '@/lib/api-auth': { authenticateApiKey: async () => ({ ok: true, userId: 'owner' }) },
      '@/lib/supabase/server': { createAdminClient: () => ({ from() {
        const query = { select() { return query; }, eq() { return query; }, then: callback => Promise.resolve({ count, error }).then(callback), insert() { assert.fail('cap must prevent registration'); } };
        return query;
      } }) },
    })('app/api/v1/agents/route.ts');
    const response = await POST(new Request('https://example.test', { method: 'POST', body: JSON.stringify({ name: 'agent', capabilities: [] }) }));
    assert.equal(response.status, status);
  }
});

test('network route rejects malformed nearby queries rather than silently returning global data', async () => {
  const { GET } = loader({
    '@/lib/supabase/server': { createAdminClient() { assert.fail('invalid query must not access database'); } },
    '@/lib/network/btcmap': { fetchBTCMapBusinesses() { assert.fail('invalid query must not become global search'); }, fetchBusinessesNearLocation() { assert.fail('invalid query must not fetch'); } },
  })('app/api/network/route.ts');
  for (const query of ['lat=0', 'lon=0', 'lat=0junk&lon=0', 'lat=0&lon=0&radius=-1', 'lat=0&lon=0&radius=Infinity', 'country=bad', 'lat=&lon=0']) {
    assert.equal((await GET({ nextUrl: new URL(`https://example.test?${query}`) })).status, 400, query);
  }
});

test('MCP sensitive tools require operator identity and history uses from/to seconds', async () => {
  const tools = new Map();
  let requested;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async url => { requested = new URL(url); return Response.json({ prices: [] }); };
  try {
    class McpServer {
      tool(name, description, schema, handler) { tools.set(name, handler); }
      async connect() {}
      async close() {}
    }
    class Transport {
      async handleRequest() { return Response.json({ ok: true }); }
      async close() {}
    }
    const { POST } = loader({
      '@modelcontextprotocol/sdk/server/mcp.js': { McpServer },
      '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js': { WebStandardStreamableHTTPServerTransport: Transport },
      '@/lib/api-auth': { authenticateApiKey: async () => ({ ok: true, userId: 'ordinary-test-user' }) },
      '@/lib/audit-guards': { ...guards, isOperator: () => false },
      '@/lib/lightning/client': { getBalances() { assert.fail('balance must not be read'); }, listChannels() { assert.fail('channels must not be read'); } },
      '*': {},
    })('app/api/mcp/route.ts');
    await POST(new Request('https://example.test', { method: 'POST' }));
    assert.equal((await tools.get('get_lightning_balance')()).isError, true);
    assert.equal((await tools.get('list_channels')()).isError, true);
    await tools.get('get_bitcoin_history')({ start_date: '2026-01-01', end_date: '2026-01-02' });
    assert.equal(requested.pathname, '/api/bitcoin-history');
    assert.equal(requested.searchParams.get('from'), String(Date.parse('2026-01-01') / 1000));
    assert.equal(requested.searchParams.get('to'), String(Date.parse('2026-01-03') / 1000 - 1));
    assert.equal(requested.searchParams.has('start'), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('L402 fails closed without a secret and requires complete valid signed payloads', () => {
  const original = process.env.L402_SECRET;
  try {
    delete process.env.L402_SECRET;
    const unconfigured = loader()('lib/lightning/l402.ts');
    assert.equal(unconfigured.verifyToken('anything.signature'), null);
    assert.throws(() => unconfigured.mintToken({}));
    process.env.L402_SECRET = 'regression-test-secret-long-enough';
    const { mintToken, verifyToken, preimageMatches } = loader()('lib/lightning/l402.ts');
    const payload = { payment_hash: 'ab'.repeat(32), resource: 'premium-report', price_sats: 100, exp: Math.floor(Date.now() / 1000) + 600 };
    const token = mintToken(payload);
    assert.deepEqual(verifyToken(token), payload);
    assert.equal(verifyToken(token + '.extra'), null);
    assert.equal(verifyToken(token.slice(0, -1) + '!'), null);
    assert.equal(preimageMatches('00'.repeat(32) + 'garbage', '00'.repeat(32)), false);
    assert.throws(() => mintToken({ ...payload, exp: 0 }));
    assert.throws(() => mintToken({ ...payload, payment_hash: 'ab' }));
  } finally {
    if (original === undefined) delete process.env.L402_SECRET;
    else process.env.L402_SECRET = original;
  }
});
