import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';
import { AiRequestError, readConversation } from '../lib/ai-quota.ts';

// Transpile and execute the actual modules with only their external services
// replaced. No API keys, paid requests, server, or database are used.
function load(file, mocks = {}, bindings = {}) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', ...Object.keys(bindings), code)(
    name => {
      assert.ok(Object.hasOwn(mocks, name), `Unexpected dependency: ${name}`);
      return mocks[name];
    }, loaded, loaded.exports, ...Object.values(bindings),
  );
  return loaded.exports;
}

const tick = async () => { for (let i = 0; i < 40; i++) await Promise.resolve(); };
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
const tool = id => ({ type: 'tool_use', id, name: `tool_${id}`, input: { id } });
const message = (...tools) => ({ stop_reason: tools.length ? 'tool_use' : 'end_turn', content: tools });

function helper(env = {}) {
  const timers = [];
  const chat = load('lib/chat-request.ts', {}, {
    process: { env: { NODE_ENV: 'production', ...env } },
    AbortSignal: {
      any: signals => AbortSignal.any(signals),
      timeout(ms) {
        const controller = new AbortController();
        timers.push({ ms, controller });
        return controller.signal;
      },
    },
  });
  return { chat, timers, expire(ms) {
    const matches = timers.filter(timer => timer.ms === ms);
    assert.ok(matches.length, `No ${ms}ms deadline registered`);
    matches.forEach(timer => timer.controller.abort(new DOMException('Deadline', 'TimeoutError')));
  } };
}

function agent(chat, runTool = async () => '{}', replies = []) {
  const calls = [];
  const tools = [];
  const { runAgentStream } = load('lib/node/agent-run.ts', {
    '@/lib/chat-request': chat,
    '@/lib/node/agent-tools': { async runNodeTool(name, input) {
      tools.push({ name, input });
      return runTool(name, input);
    } },
  });
  const anthropic = { messages: { stream(params, options) {
    const reply = replies[calls.length] ?? message();
    const call = { params: structuredClone(params), options, text: () => {} };
    calls.push(call);
    return {
      on(event, callback) { assert.equal(event, 'text'); call.text = callback; },
      finalMessage: async () => reply,
    };
  } } };
  return { calls, tools, anthropic, runAgentStream, run(signal, events = {}, opts = {}) {
    return runAgentStream(anthropic, {
      model: 'test', system: 'system', tools: [], messages: [{ role: 'user', content: 'test' }], signal, ...opts,
    }, { onText() {}, ...events });
  } };
}

test('agent: actual model options and tool results survive multiple turns without retries', async () => {
  const { chat } = helper();
  const controller = new AbortController();
  const h = agent(chat, async () => '{"ok":true}', [message(tool('a'), tool('b')), message(tool('c')), message()]);
  await h.run(controller.signal);
  assert.equal(h.calls.length, 3);
  assert.equal(h.tools.length, 3);
  for (const { options } of h.calls) {
    assert.equal(options.signal, controller.signal);
    assert.equal(options.maxRetries, 0);
    assert.ok(options.timeout > 0 && options.timeout <= 55_000);
  }
  assert.equal(h.calls[1].params.messages.at(-1).content.length, 2);
  assert.equal(h.calls[2].params.messages.at(-1).content[0].tool_use_id, 'c');
});

test('agent: pre-aborted signals and abort in onTool prevent even the first tool', async () => {
  const { chat } = helper();
  const controller = new AbortController();
  const h = agent(chat, undefined, [message(tool('a'))]);
  controller.abort();
  await assert.rejects(h.run(controller.signal), { name: 'AbortError' });
  assert.equal(h.calls.length, 0);
  const next = new AbortController();
  await assert.rejects(h.run(next.signal, { onTool: () => next.abort() }), { name: 'AbortError' });
  assert.equal(h.calls.length, 1);
  assert.equal(h.tools.length, 0);
});

test('agent: abort during a nested tool stops waiting, suppresses results and all later work', async () => {
  const { chat } = helper();
  const pending = deferred();
  const controller = new AbortController();
  const h = agent(chat, () => pending.promise, [message(tool('a'), tool('b'))]);
  const results = [];
  const running = h.run(controller.signal, { onToolResult: (...args) => results.push(args) });
  await tick();
  assert.equal(h.tools.length, 1);
  controller.abort();
  await assert.rejects(running, { name: 'AbortError' });
  pending.resolve('{}');
  await tick();
  assert.deepEqual(results, []);
  assert.equal(h.tools.length, 1);
  assert.equal(h.calls.length, 1);
});

test('agent: abort between tool results prevents another tool or model iteration', async () => {
  const { chat } = helper();
  for (const tools of [[tool('a'), tool('b')], [tool('a')]]) {
    const controller = new AbortController();
    const h = agent(chat, undefined, [message(...tools)]);
    await assert.rejects(h.run(controller.signal, { onToolResult: () => controller.abort() }), { name: 'AbortError' });
    assert.equal(h.tools.length, 1);
    assert.equal(h.calls.length, 1);
  }
});

test('agent: iteration limit still bounds a model that continually requests tools', async () => {
  const { chat } = helper();
  const h = agent(chat, undefined, Array.from({ length: 6 }, () => message(tool('a'))));
  await h.run(new AbortController().signal, {}, { maxIterations: 2 });
  assert.equal(h.calls.length, 2);
  assert.equal(h.tools.length, 2);
});

test('SSE: even an uncancellable producer cannot enqueue after reader cancellation or request abort', async () => {
  for (const stop of ['reader', 'request']) {
    const { chat } = helper();
    const cancellation = new AbortController();
    const request = new AbortController();
    const signal = chat.chatRequestSignal(new Request('https://contrabxnd.io', { signal: request.signal }), cancellation);
    const pending = deferred();
    let send;
    const stream = chat.chatStream(cancellation, signal, async publish => {
      send = publish;
      await pending.promise;
      publish({ text: 'late producer' });
    }, { error: 'failed' });
    const reader = stream.getReader();
    if (stop === 'reader') await reader.cancel();
    else request.abort();
    assert.doesNotThrow(() => send({ text: 'late callback' }));
    pending.resolve();
    await tick();
    assert.equal(signal.aborted, true);
    assert.deepEqual(await reader.read(), { value: undefined, done: true });
  }
});

function routeHarness(route, { replies, runTool, quota, fetchContext, env } = {}) {
  const h = helper({ ANTHROPIC_API_KEY: 'test-only', ...env });
  const a = agent(h.chat, runTool, replies);
  const clients = [];
  const fetches = [];
  const quotas = [];
  class Anthropic {
    constructor(options) { clients.push(options); this.messages = a.anthropic.messages; }
  }
  const { POST, maxDuration } = load(`app/api/${route}/route.ts`, {
    '@anthropic-ai/sdk': Anthropic,
    '@/lib/supabase/server': { createClient: async () => ({}), createAdminClient: () => ({}) },
    '@/lib/ai-quota': { AiRequestError, readConversation, consumeAiQuota: async (...args) => {
      quotas.push(args);
      return quota ? quota() : { allowed: true, remaining: 4 };
    } },
    '@/lib/node/agent-tools': { NODE_TOOLS: [] },
    '@/lib/node/agent-run': { runAgentStream: a.runAgentStream },
    '@/lib/chat-request': h.chat,
  }, {
    process: { env: { ANTHROPIC_API_KEY: 'test-only', NODE_ENV: 'production', ...env } },
    AbortSignal: { any: signals => AbortSignal.any(signals), timeout(ms) {
      const controller = new AbortController();
      h.timers.push({ ms, controller });
      return controller.signal;
    } },
    fetch: async (url, options) => {
      fetches.push({ url, options });
      return fetchContext ? fetchContext(url, options) : Response.json({ value: 1 });
    },
  });
  function request(signal, headers = {}, messages = [{ role: 'user', content: 'test' }]) {
    return POST(new Request('https://contrabxnd.io/api/chat', {
      method: 'POST', signal, headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({ messages }),
    }));
  }
  return { ...h, ...a, clients, fetches, quotas, request, maxDuration };
}

for (const route of ['ai/analyst', 'explorer/chat']) {
  for (const stop of ['request', 'reader', 'deadline']) {
    test(`${route}: ${stop} cancellation on a later model turn aborts SDK and prevents late SSE/tools`, async () => {
      const pending = deferred();
      const h = routeHarness(route, { replies: [message(tool('a')), pending.promise] });
      const controller = new AbortController();
      const response = await h.request(controller.signal);
      const reader = response.body.getReader();
      await tick();
      assert.equal(h.calls.length, 2);
      assert.equal(h.tools.length, 1);
      assert.equal(h.maxDuration, 60);
      assert.equal(h.timers.filter(timer => timer.ms === 55_000).length, 1, 'One deadline for preparation and all turns');
      assert.equal(h.calls[0].options.signal, h.calls[1].options.signal);
      assert.deepEqual(h.clients[0], { apiKey: 'test-only', timeout: 55_000, maxRetries: 0 });
      if (stop === 'request') controller.abort();
      if (stop === 'reader') await reader.cancel();
      if (stop === 'deadline') h.expire(55_000);
      assert.equal(h.calls[1].options.signal.aborted, true);
      h.calls[1].text('must not enqueue after cancellation');
      pending.resolve(message(tool('late')));
      await tick();
      let wire = '';
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        wire += new TextDecoder().decode(chunk.value);
      }
      assert.ok(!wire.includes('must not enqueue'));
      assert.ok(!wire.includes('[DONE]'));
      assert.equal(h.calls.length, 2);
      assert.equal(h.tools.length, 1);
    });
  }

  test(`${route}: overall deadline includes quota preparation, not just model turns`, async () => {
    const pending = deferred();
    const h = routeHarness(route, { quota: () => pending.promise });
    const response = h.request();
    await tick();
    assert.equal(h.quotas.length, 1);
    h.expire(55_000);
    assert.equal((await response).status, 504);
    pending.resolve({ allowed: true, remaining: 4 });
    await tick();
    assert.equal(h.calls.length, 0);
  });

  test(`${route}: normal completion keeps SSE completion and quota behavior`, async () => {
    const h = routeHarness(route);
    const response = await h.request();
    const wire = await response.text();
    assert.equal(response.status, 200);
    assert.ok(wire.includes('"remaining":4'));
    assert.ok(wire.endsWith('data: [DONE]\n\n'));
    assert.equal(h.quotas.length, 1);
    assert.equal(h.quotas[0][1], route === 'ai/analyst' ? 'analyst' : 'explorer');
  });

  test(`${route}: validation and quota denials still prevent paid work`, async () => {
    const invalid = routeHarness(route);
    const rejected = await invalid.request(undefined, {}, [{ role: 'user', content: 'x'.repeat(501) }]);
    assert.equal(rejected.status, 400);
    assert.equal(invalid.quotas.length, 0);
    assert.equal(invalid.calls.length, 0);
    for (const { quota, status } of [
      { quota: () => ({ allowed: false, isAuth: true }), status: 429 },
      { quota: () => ({ allowed: false, retryAfter: 3 }), status: 429 },
      { quota: () => { throw new Error('Database unavailable'); }, status: 503 },
    ]) {
      const denied = routeHarness(route, { quota });
      const response = await denied.request();
      assert.equal(response.status, status);
      assert.equal(denied.calls.length, 0);
      assert.equal(denied.fetches.length, 0);
    }
  });

  test(`${route}: hostile Origin/Host cannot bypass exact allowlist`, async () => {
    const h = routeHarness(route, { env: { NEXT_PUBLIC_APP_URL: 'https://preview.example' } });
    const denied = await h.request(undefined, { origin: 'https://preview.example.evil.test', host: 'preview.example.evil.test' });
    assert.equal(denied.status, 403);
    assert.equal(h.quotas.length, 0);
    const allowed = await h.request(undefined, { origin: 'https://preview.example', host: 'evil.test' });
    assert.equal(allowed.status, 200);
    await allowed.text();
    for (const fetch of h.fetches) assert.ok(fetch.url.startsWith('https://preview.example/api/'));
  });
}

test('analyst: context fetch deadline is independent of request abort and does not cancel the model', async () => {
  const h = routeHarness('ai/analyst', { fetchContext: (_url, { signal }) => new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  }) });
  const pending = h.request();
  await tick();
  assert.equal(h.fetches.length, 7);
  assert.equal(h.calls.length, 0);
  h.expire(8_000);
  const response = await pending;
  await response.text();
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].options.signal.aborted, false);
  assert.ok(h.calls[0].params.system.includes('"score": null'));
});

test('analyst: request abort propagates to every context fetch without starting a model', async () => {
  const h = routeHarness('ai/analyst', { fetchContext: () => new Promise(() => {}) });
  const controller = new AbortController();
  const pending = h.request(controller.signal);
  await tick();
  assert.equal(h.fetches.length, 7);
  controller.abort();
  assert.equal((await pending).status, 499);
  assert.ok(h.fetches.every(fetch => fetch.options.signal.aborted));
  assert.equal(h.calls.length, 0);
});

test('origins: canonical and Vercel configuration allow only exact validated origins', () => {
  const { chat } = helper({ NEXT_PUBLIC_APP_URL: 'https://canonical.example/', VERCEL_URL: 'branch-team.vercel.app' });
  for (const origin of [null, '', 'https://contrabxnd.io', 'https://www.contrabxnd.io', 'https://canonical.example', 'https://branch-team.vercel.app']) {
    assert.equal(chat.isAllowedChatOrigin(origin), true, String(origin));
  }
  for (const origin of ['null', 'https://canonical.example/', 'https://canonical.example/path', 'https://canonical.example.evil.test',
    'https://canonical.example@evil.test', 'http://canonical.example', 'https://canonical.example:3107',
    'https://other.vercel.app', 'http://localhost:3000', 'http://127.0.0.1:3107', 'https://evil.test']) {
    assert.equal(chat.isAllowedChatOrigin(origin), false, origin);
  }
  assert.equal(chat.chatBaseUrl(), 'https://canonical.example');
  assert.equal(helper({ VERCEL_URL: 'https://branch.vercel.app' }).chat.chatBaseUrl(), 'https://branch.vercel.app');
});

test('origins: localhost and 127.0.0.1 at any port are development-only, never hostname prefixes', () => {
  const dev = helper({ NODE_ENV: 'development' }).chat;
  for (const origin of ['http://localhost:3107', 'http://127.0.0.1:3107', 'https://localhost:8443', 'http://localhost']) {
    assert.equal(dev.isAllowedChatOrigin(origin), true, origin);
    assert.equal(helper({ NEXT_PUBLIC_APP_URL: origin, VERCEL_URL: origin }).chat.isAllowedChatOrigin(origin), false, origin);
  }
  for (const origin of ['http://localhost.evil.test:3107', 'http://127.0.0.1.evil.test', 'http://localhost:3107/path',
    'http://localhost:3107@evil.test', 'http://[::1]:3107']) assert.equal(dev.isAllowedChatOrigin(origin), false, origin);
});

test('origins: malformed, credentialed, or non-root configured URLs never become trusted', () => {
  for (const value of ['not a url', 'javascript:alert(1)', 'ftp://bad.example', 'https://user:pass@bad.example',
    'https://bad.example/path', 'https://bad.example?x=1', 'https://bad.example/#fragment', '//bad.example',
    ' https://bad.example', 'https://bad.example\\@evil.test']) {
    const { chat } = helper({ NEXT_PUBLIC_APP_URL: value, VERCEL_URL: value });
    assert.equal(chat.isAllowedChatOrigin('https://bad.example'), false, value);
    assert.equal(chat.isAllowedChatOrigin('https://evil.test'), false, value);
    assert.equal(chat.chatBaseUrl(), 'https://contrabxnd.io', value);
  }
});
