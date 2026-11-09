import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { priceLookup, runIndexer, validateManifest } from './onchain-indexer/index.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const now = Date.parse('2026-11-09T12:00:00Z');
class FixedDate extends Date {
  constructor(...args) { super(...(args.length ? args : [now])); }
  static now() { return now; }
}

// Execute real TS modules with isolated env/fetch/clock, without global mutations.
function load(file, { env = {}, fetchFn, deadlines = [] } = {}) {
  const cache = new Map();
  function moduleAt(path) {
    if (cache.has(path)) return cache.get(path).exports;
    const loaded = { exports: {} };
    cache.set(path, loaded);
    const code = ts.transpileModule(readFileSync(path, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    new Function('require', 'module', 'exports', 'process', 'fetch', 'Date', 'AbortSignal', code)(
      name => name.startsWith('.') ? moduleAt(resolve(dirname(path), `${name}.ts`)) : require(name),
      loaded, loaded.exports, { env }, fetchFn ?? (() => { throw new Error('Unexpected fetch'); }), FixedDate,
      { timeout(ms) { deadlines.push(ms); return AbortSignal.timeout(ms); }, any: AbortSignal.any.bind(AbortSignal) },
    );
    return loaded.exports;
  }
  return moduleAt(resolve(root, file));
}

const hash = height => height.toString(16).padStart(64, '0');
const timestamps = [1231006505, 1231092905];
async function fixture(t, csv = 'height,amount\n0,5000000000\n1,5000000000\n', overrides = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'provider-indexer-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const env = { UTXO_CSV: join(dir, 'utxos.csv'), BTC_PRICE_HISTORY: join(dir, 'prices.json'), MEMPOOL_URL: 'http://node.test' };
  const manifest = {
    height: 1, hash: hash(1), timestamp: timestamps[1],
    checksum: createHash('sha256').update(csv).digest('hex'), rowCount: 2, ...overrides,
  };
  await writeFile(env.UTXO_CSV, csv);
  await writeFile(`${env.UTXO_CSV}.manifest.json`, JSON.stringify(manifest));
  await writeFile(env.BTC_PRICE_HISTORY, JSON.stringify({ '2009-01-03': 0, '2009-01-04': 2 }));
  const calls = [];
  const fetchFn = async (url, init) => {
    calls.push({ url, init });
    assert.equal(init.method, undefined, 'read-only requests only');
    assert.ok(init.signal instanceof AbortSignal);
    assert.equal(new URL(url).origin, 'http://node.test', 'no public or DB requests');
    if (url.includes('/api/block-height/')) return new Response(hash(Number(url.split('/').at(-1))));
    if (url.includes('/api/block/')) {
      const height = parseInt(url.split('/').at(-1), 16);
      return Response.json({ id: hash(height), height, timestamp: timestamps[height] });
    }
    throw new Error(`Unexpected request: ${url}`);
  };
  return { env, manifest, calls, fetchFn, now };
}

test('old dump uses manifest height/date, explicit prices and zero rejected rows, never DB/tip', async t => {
  const f = await fixture(t);
  f.env.SUPABASE_URL = 'https://must-not-write.test';
  f.env.SUPABASE_SERVICE_ROLE_KEY = 'unused';
  const row = await runIndexer(f);
  assert.equal(row.date, '2009-01-04');
  assert.equal(row.block_height, 1);
  assert.equal(row.total_supply, 100);
  assert.equal(row.realized_cap, 100);
  assert.equal(row.realized_price, 1);
  assert.equal(row.audit.acceptedRows, 2);
  assert.equal(row.audit.rejectedRows, 0);
  assert.equal(row.audit.checksum, f.manifest.checksum);
  assert.equal(f.calls.length, 4);
});

test('manifest requires complete well-formed dump provenance', async t => {
  const f = await fixture(t);
  for (const field of ['height', 'hash', 'timestamp', 'checksum', 'rowCount']) {
    const bad = { ...f.manifest }; delete bad[field];
    assert.throws(() => validateManifest(bad, now), /Invalid manifest/);
  }
  for (const bad of [{ height: -1 }, { height: 1.5 }, { timestamp: now }, { rowCount: 0 }, { hash: 'bad' }, { checksum: 'bad' }]) {
    assert.throws(() => validateManifest({ ...f.manifest, ...bad }, now), /Invalid manifest/);
  }
  await assert.rejects(runIndexer({ ...f, env: { ...f.env, UTXO_MANIFEST: join(dirname(f.env.UTXO_CSV), 'missing.json') } }), /ENOENT/);
});

test('checksum, row count, node hash and timestamp mismatches fail closed', async t => {
  for (const [overrides, error] of [
    [{ checksum: 'f'.repeat(64) }, /checksum mismatch/],
    [{ rowCount: 3 }, /rowCount mismatch/],
    [{ hash: 'f'.repeat(64) }, /hash\/timestamp/],
    [{ timestamp: timestamps[1] + 1 }, /hash\/timestamp/],
  ]) {
    const f = await fixture(t, undefined, overrides);
    await assert.rejects(runIndexer(f), error);
  }
});

test('CSV rejects every invalid row rather than silently publishing partial aggregates', async t => {
  const invalid = ['-1,1', '0,-1', '1.5,1', '0,1.5', '2,1', '0,12junk', '0,1,2', '', 'NaN,1', '0,9007199254740992'];
  const csv = `height,amount\n0,5000000000\n1,5000000000\n${invalid.join('\n')}\n`;
  const f = await fixture(t, csv, { rowCount: invalid.length + 2 });
  await assert.rejects(runIndexer(f), /rejectedRows=10, acceptedRows=2/);
});

test('empty, zero, partial and excessive supply are rejected', async t => {
  for (const csv of ['height,amount\n', '0,0\n1,0\n', '0,1\n1,1\n', '0,2100000000000000\n1,1\n']) {
    const f = await fixture(t, csv, { rowCount: csv === 'height,amount\n' ? 1 : 2 });
    await assert.rejects(runIndexer(f), /rowCount mismatch|implausible/);
  }
});

test('missing/pre-market/gap prices fail closed, explicit zero is allowed', async t => {
  const lookup = priceLookup({ '2010-01-01': 1, '2010-01-03': 3 });
  for (const date of ['2009-01-03', '2010-01-02', '2026-11-09']) assert.throws(() => lookup(date), /Missing BTC\/USD/);
  assert.equal(priceLookup({ '2009-01-03': 0 })('2009-01-03'), 0);
  for (const bad of [{}, { '2026-02-30': 1 }, { '2009-01-03': -1 }, { '2009-01-03': '1' }]) {
    assert.throws(() => priceLookup(bad), /history/);
  }
  const f = await fixture(t);
  await writeFile(f.env.BTC_PRICE_HISTORY, '{"2009-01-03":0}');
  await assert.rejects(runIndexer(f), /Missing BTC\/USD price for 2009-01-04/);
});

test('history requires local provisioning or authenticated Pro API, never unauthenticated max', async t => {
  const f = await fixture(t);
  delete f.env.BTC_PRICE_HISTORY;
  await assert.rejects(runIndexer(f), /Provision BTC_PRICE_HISTORY or COINGECKO_PRO_API_KEY/);
  f.env.COINGECKO_PRO_API_KEY = 'test-key';
  const row = await runIndexer({ ...f, fetchFn: async (url, init) => {
    if (new URL(url).hostname === 'pro-api.coingecko.com') {
      assert.equal(init.headers['x-cg-pro-api-key'], 'test-key');
      assert.ok(init.signal instanceof AbortSignal);
      return Response.json({ prices: [[Date.parse('2009-01-03'), 0], [Date.parse('2009-01-04'), 2]] });
    }
    return f.fetchFn(url, init);
  } });
  assert.equal(row.realized_cap, 100);
});

test('missing CSV and failed node requests reject without a candidate', async t => {
  const f = await fixture(t);
  await rm(f.env.UTXO_CSV);
  await assert.rejects(runIndexer(f), /ENOENT/);
  await assert.rejects(runIndexer({ ...f, fetchFn: async () => new Response('', { status: 503 }) }), /HTTP 503/);
});

test('nodeFetch retains node/public source labels and default public fallback', async () => {
  for (const failure of ['http', 'throw', 'timeout']) {
    const calls = [], deadlines = [];
    const client = load('lib/node/client.ts', { env: { NODE_MEMPOOL_URL: 'https://node.test/' }, deadlines,
      fetchFn: async (url, init) => {
        calls.push({ url, init });
        if (url.startsWith('https://node.test')) {
          if (failure !== 'http') throw new DOMException('node failed', failure === 'timeout' ? 'TimeoutError' : 'NetworkError');
          return new Response('', { status: 503 });
        }
        return Response.json({ ok: true });
      } });
    assert.equal((await client.nodeJson('/api/test')).source, 'public');
    assert.equal(calls.length, 2);
    assert.deepEqual(deadlines, [8000, 8000]);
  }
  const client = load('lib/node/client.ts', { env: { NODE_MEMPOOL_URL: 'https://node.test' }, fetchFn: async () => Response.json({ ok: true }) });
  assert.equal((await client.nodeJson('/api/test')).source, 'node');
});

test('privacy mode prohibits outbound public fallback when missing, failing or non-OK node', async () => {
  for (const node of [undefined, 'https://node.test']) {
    for (const fail of [false, true]) {
      const calls = [];
      const client = load('lib/node/client.ts', { env: { NODE_MEMPOOL_URL: node, NODE_PUBLIC_FALLBACK: 'false' },
        fetchFn: async url => {
          calls.push(url);
          assert.equal(new URL(url).hostname, 'node.test');
          if (fail) throw new Error('node down');
          return new Response('', { status: 503 });
        } });
      if (!node || fail) await assert.rejects(client.nodeFetch('/api/test'));
      else assert.equal((await client.nodeFetch('/api/test')).source, 'node');
      assert.equal(calls.length, node ? 1 : 0);
    }
  }
});

test('node access credentials stay on the node request during public fallback', async () => {
  const calls = [];
  const client = load('lib/node/client.ts', {
    env: { NODE_MEMPOOL_URL: 'https://node.test', CF_ACCESS_CLIENT_ID: 'id', CF_ACCESS_CLIENT_SECRET: 'secret' },
    fetchFn: async (url, init) => {
      calls.push({ url, init });
      return new Response('{}', { status: calls.length === 1 ? 503 : 200 });
    },
  });
  assert.equal((await client.nodeFetch('/api/test')).source, 'public');
  assert.equal(calls[0].init.headers['CF-Access-Client-Secret'], 'secret');
  assert.equal(calls[1].init.headers?.['CF-Access-Client-Secret'], undefined);
  const publicOnly = load('lib/node/client.ts', { fetchFn: async () => Response.json({}) });
  assert.equal((await publicOnly.nodeFetch('/api/test')).source, 'public');
});

test('caller cancellation is preserved and never triggers public fallback', async () => {
  const controller = new AbortController();
  const calls = [];
  const client = load('lib/node/client.ts', { env: { NODE_MEMPOOL_URL: 'https://node.test' }, fetchFn: async (url, init) => {
    calls.push(url);
    controller.abort();
    assert.equal(init.signal.aborted, true);
    init.signal.throwIfAborted();
  } });
  await assert.rejects(client.nodeFetch('/api/test', { signal: controller.signal }), /abort/i);
  await assert.rejects(client.nodeFetch('/api/test', { signal: controller.signal }), /abort/i);
  assert.equal(calls.length, 1);
});

test('FRED transport/timeout/JSON/HTTP failures reach NY Fed with bounded fetches and unchanged target', async () => {
  for (const failure of ['transport', 'timeout', 'json', 'http']) {
    const calls = [], deadlines = [];
    const scraper = load('lib/fedwatch/scraper.ts', {
      env: { FRED_API_KEY: 'test', BARCHART_API_KEY: 'test' }, deadlines,
      fetchFn: async (url, init) => {
        calls.push(url);
        assert.ok(init.signal instanceof AbortSignal);
        if (url.includes('stlouisfed.org')) {
          if (failure === 'transport') throw new Error('offline');
          if (failure === 'timeout') throw new DOMException('deadline', 'TimeoutError');
          if (failure === 'json') return new Response('not JSON');
          return new Response('', { status: 503 });
        }
        if (url.includes('newyorkfed.org')) return Response.json({ refRates: [{
          targetRateUpper: '3.75', targetRateLower: '3.5', percentRate: '3.6', effectiveDate: '2026-11-09',
        }] });
        if (url.includes('barchart.com')) return Response.json({ status: { code: 200 },
          results: new URL(url).searchParams.get('symbols').split(',').map(symbol => ({ symbol, settlement: 96.4, tradeTimestamp: '2026-11-09' })),
        });
        throw new Error(`Unexpected provider ${url}`);
      },
    });
    const row = await scraper.scrapeFedWatch();
    assert.equal(row.target_lower, 3.5);
    assert.equal(row.target_upper, 3.75);
    assert.ok(row.sources.includes('ny-fed'));
    assert.ok(!row.sources.includes('fred'));
    assert.equal(calls.filter(url => url.includes('newyorkfed.org')).length, 2);
    assert.ok(deadlines.length >= 5 && deadlines.every(ms => ms === 8000));
  }
});

test('every provider fetch in the allowed scraper/spot/indexer modules has an explicit 8s signal', () => {
  for (const file of ['lib/etf/scrapers.ts', 'lib/fedwatch/scraper.ts', 'lib/liquidity/scraper.ts', 'lib/slr/scraper.ts', 'lib/polymarket/scraper.ts', 'lib/price.ts', 'scripts/onchain-indexer/index.mjs']) {
    const source = ts.createSourceFile(file, readFileSync(resolve(root, file), 'utf8'), ts.ScriptTarget.Latest, true);
    let count = 0;
    function visit(node) {
      if (ts.isCallExpression(node) && ['fetch', 'fetchFn'].includes(node.expression.getText(source))) {
        count++;
        const options = node.arguments[1];
        assert.ok(options && ts.isObjectLiteralExpression(options), `${file}: explicit options`);
        assert.ok(options.properties.some(prop => ts.isPropertyAssignment(prop) && prop.name.getText(source) === 'signal' &&
          prop.initializer.getText(source) === 'AbortSignal.timeout(8000)'), `${file}: bounded signal`);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    assert.ok(count > 0, `${file}: expected provider fetches`);
  }
});
