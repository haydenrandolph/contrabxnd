import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';
import { readConversation } from '../lib/ai-quota.ts';

const clients = [
  { name: 'terminal', file: 'app/page.tsx', handler: 'sendAiMessage', requestRef: 'aiRequestRef', limit: 10 },
  { name: 'explorer', file: 'app/infra/explorer/page.tsx', handler: 'send', requestRef: 'requestRef', limit: 12 },
];
const prematureError = 'Connection ended before the response completed. Try again.';
const encoder = new TextEncoder();

function event(client, text) {
  return `data: ${JSON.stringify(client.name === 'terminal' ? { text } : { type: 'text', text })}\n\n`;
}

// Execute the real callbacks, not a second implementation of SSE framing. AST
// extraction avoids rendering the pages or depending on their hook positions.
function sourceCallbacks(client) {
  const path = new URL(`../${client.file}`, import.meta.url);
  const source = ts.createSourceFile(client.file, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let callback;
  let cleanup;
  let cardTools;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      if (node.name.text === client.handler) {
        assert.ok(ts.isCallExpression(node.initializer));
        assert.equal(node.initializer.expression.getText(source), 'useCallback');
        callback = node.initializer.arguments[0];
      }
      if (node.name.text === 'CARD_TOOLS') cardTools = node.initializer;
    }
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'useEffect') {
      const effect = node.arguments[0];
      if (effect && ts.isArrowFunction(effect) && ts.isArrowFunction(effect.body)
        && effect.body.getText(source).includes(`${client.requestRef}.current?.abort()`)) {
        cleanup = effect.body;
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(callback && ts.isArrowFunction(callback), `${client.file}: missing send callback`);
  assert.ok(cleanup, `${client.file}: missing abort cleanup`);
  return ts.transpileModule(`
    ${cardTools ? `const CARD_TOOLS = ${cardTools.getText(source)};` : ''}
    exports.send = (${callback.getText(source)});
    exports.cleanup = (${cleanup.getText(source)});
  `, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}

function harness(client, chunks, { history = [], input = 'test', abortAtRead, readError, respond } = {}) {
  const state = { messages: history, input, streaming: false, remaining: null, error: null };
  const requests = [];
  const reads = { count: 0, cancelled: 0, released: 0 };
  const requestRef = { current: null };
  const setter = key => value => { state[key] = typeof value === 'function' ? value(state[key]) : value; };
  let cleanup;
  const reader = {
    async read() {
      const index = reads.count++;
      if (reads.count === abortAtRead) cleanup();
      if (readError && index === chunks.length) throw new Error(readError);
      return index < chunks.length ? { done: false, value: chunks[index] } : { done: true };
    },
    async cancel() { reads.cancelled++; },
    releaseLock() { reads.released++; },
  };
  const terminal = client.name === 'terminal';
  const bindings = {
    [terminal ? 'aiMessages' : 'messages']: history,
    [terminal ? 'aiInput' : 'input']: state.input,
    [terminal ? 'aiStreaming' : 'loading']: false,
    [client.requestRef]: requestRef,
    [terminal ? 'setAiMessages' : 'setMessages']: setter('messages'),
    [terminal ? 'setAiInput' : 'setInput']: setter('input'),
    [terminal ? 'setAiStreaming' : 'setLoading']: setter('streaming'),
    setAiRemaining: setter('remaining'),
    setError: setter('error'),
    aiScrollRef: { current: null },
    fetch: async (url, options) => {
      requests.push({ url, signal: options.signal, body: JSON.parse(options.body) });
      if (respond) return respond(url, options);
      return { ok: true, body: { getReader: () => reader } };
    },
  };
  const exports = {};
  new Function('exports', ...Object.keys(bindings), sourceCallbacks(client))(exports, ...Object.values(bindings));
  cleanup = exports.cleanup;
  return {
    state, requests, reads, requestRef, cleanup,
    send: () => exports.send(input),
    assistantText: () => state.messages.filter(message => message.role === 'assistant').map(message => message.content).join('\n'),
    assertReleased() {
      assert.equal(reads.cancelled, 1, 'reader must be cancelled');
      assert.equal(reads.released, 1, 'reader lock must be released');
      assert.equal(requestRef.current, null, 'request reference must be cleared');
    },
    assertError(message) {
      if (terminal) assert.ok(state.messages.some(item => item.role === 'assistant' && item.content === message));
      else assert.equal(state.error, message);
    },
  };
}

for (const client of clients) {
  test(`${client.name}: byte-split UTF-8 and CRLF frames survive comments and stop at DONE`, async () => {
    const wire = `: heartbeat\r\nevent: message\r\n${event(client, 'BTC \u20ac').replaceAll('\n', '\r\n')}`
      + 'data:[DONE]\r\n\r\ndata: invalid JSON\r\n\r\n';
    const chunks = Array.from(encoder.encode(wire), byte => Uint8Array.of(byte));
    const h = harness(client, chunks);
    await h.send();
    assert.equal(h.assistantText(), 'BTC \u20ac');
    assert.ok(h.reads.count < chunks.length, 'DONE must stop the outer read loop');
    assert.equal(h.state.error, null);
    assert.equal(h.state.streaming, false);
    h.assertReleased();
  });

  test(`${client.name}: coalesced LF frames, multiline data, and trailing DONE are parsed`, async () => {
    const fields = client.name === 'terminal' ? '"text": "second"' : '"type": "text", "text": "second"';
    const wire = event(client, 'first ')
      + `event: message\ndata: {\ndata: ${fields}}\n\n`
      + 'data: [DONE]\n\ndata: invalid JSON\n\n';
    const h = harness(client, [encoder.encode(wire)]);
    await h.send();
    assert.equal(h.assistantText(), 'first second');
    assert.equal(h.state.error, null);
    h.assertReleased();
  });

  test(`${client.name}: EOF flushes an unterminated final DONE frame`, async () => {
    const h = harness(client, [encoder.encode(event(client, 'complete') + 'data: [DONE]')]);
    await h.send();
    assert.equal(h.assistantText(), 'complete');
    assert.equal(h.state.error, null);
    h.assertReleased();
  });

  test(`${client.name}: streamed errors preserve partial text and release the reader`, async () => {
    const wire = event(client, 'partial') + 'data: {"type":"error","error":"boom"}\n\n';
    const h = harness(client, [encoder.encode(wire)]);
    await h.send();
    assert.ok(h.assistantText().includes('partial'));
    h.assertError('boom');
    assert.equal(h.state.streaming, false);
    h.assertReleased();
  });

  test(`${client.name}: premature EOF reports incomplete responses instead of succeeding`, async () => {
    const h = harness(client, [encoder.encode(event(client, 'partial'))]);
    await h.send();
    assert.ok(h.assistantText().includes('partial'));
    h.assertError(prematureError);
    h.assertReleased();
  });

  test(`${client.name}: malformed payloads and read failures are surfaced`, async () => {
    for (const malformed of [true, false]) {
      const h = harness(client, [encoder.encode(malformed ? 'data: {invalid}\n\n' : event(client, 'partial'))],
        malformed ? {} : { readError: 'socket failed' });
      await h.send();
      if (malformed) {
        assert.ok(client.name === 'terminal' ? h.assistantText() : h.state.error, 'malformed JSON must not be silently skipped');
      } else h.assertError('socket failed');
      assert.equal(h.state.streaming, false);
      h.assertReleased();
    }
  });

  test(`${client.name}: unmount before the response aborts without consuming or appending content`, async () => {
    const h = harness(client, [encoder.encode(event(client, 'stale'))]);
    const pending = h.send();
    h.cleanup();
    await pending;
    assert.equal(h.requests[0].signal.aborted, true);
    assert.equal(h.reads.count, 0);
    assert.equal(h.assistantText(), '');
    assert.equal(h.state.error, null);
    assert.equal(h.requestRef.current, null);
  });

  test(`${client.name}: abort during a read suppresses stale text and still releases the reader`, async () => {
    const h = harness(client, [encoder.encode(event(client, 'partial')), encoder.encode(event(client, 'stale'))], { abortAtRead: 2 });
    await h.send();
    assert.equal(h.requests[0].signal.aborted, true);
    assert.equal(h.assistantText(), 'partial');
    assert.equal(h.state.error, null);
    h.assertReleased();
  });

  test(`${client.name}: the full request bounds valid history and excludes invalid or stopped exchanges`, async () => {
    const history = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'x'.repeat(i % 2 ? 5000 : 500) }));
    history.push({ role: 'user', content: 'x'.repeat(501) }, { role: 'assistant', content: 'invalid prompt reply' },
      { role: 'user', content: 'stopped', context: false }, { role: 'assistant', content: '   ', context: false });
    const h = harness(client, [encoder.encode('data: [DONE]\n\n')], { history });
    await h.send();
    const { messages } = h.requests[0].body;
    assert.equal(messages.length, client.limit - 1);
    assert.ok(messages.every(message => message.content.trim() && message.content.length <= (message.role === 'user' ? 500 : 4000)));
    assert.equal(messages[0].role, 'user');
    assert.deepEqual(messages.at(-1), { role: 'user', content: 'test' });
    assert.deepEqual(await readConversation(new Request('https://example.test', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(h.requests[0].body),
    })), messages);
    h.assertReleased();
  });

  test(`${client.name}: actual serialized requests pass server validation across history rollover`, async () => {
    let history = [];
    for (let turn = 1; turn <= client.limit / 2 + 3; turn++) {
      const h = harness(client, [encoder.encode(event(client, `reply ${turn}`) + 'data: [DONE]\n\n')], {
        history, input: `  ${String(turn).repeat(500).slice(0, 500)}  `,
      });
      await h.send();
      const { body } = h.requests[0];
      const messages = await readConversation(new Request('https://example.test', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
      }));
      assert.equal(messages.length, Math.min(turn * 2 - 1, client.limit - 1));
      assert.equal(messages[0].role, 'user');
      assert.equal(messages.at(-1).role, 'user');
      assert.equal(messages.at(-1).content.length, 500);
      assert.ok(messages.every(message => !Object.hasOwn(message, 'context')));
      history = h.state.messages;
      h.assertReleased();
    }
  });

  test(`${client.name}: oversized submission is rejected locally without poisoning a valid follow-up`, async () => {
    const h = harness(client, [], { input: 'x'.repeat(501) });
    await h.send();
    assert.equal(h.requests.length, 0);
    assert.deepEqual(h.state.messages, []);
    assert.equal(h.state.input, 'x'.repeat(501));
    assert.equal(h.requestRef.current, null);
    const next = harness(client, [encoder.encode('data: [DONE]\n\n')], { history: h.state.messages, input: 'hi' });
    await next.send();
    assert.deepEqual(await readConversation(new Request('https://example.test', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(next.requests[0].body),
    })), [{ role: 'user', content: 'hi' }]);
  });

  test(`${client.name}: HTTP validation rejection excludes the failed prompt and error from subsequent context`, async () => {
    const prior = [{ role: 'user', content: 'earlier' }, { role: 'assistant', content: 'answer' }];
    const h = harness(client, [], { history: prior, input: 'rejected prompt', respond: () => Response.json({ error: 'Conversation too long' }, { status: 400 }) });
    await h.send();
    h.assertError('Conversation too long');
    assert.ok(h.state.messages.some(message => message.content === 'rejected prompt'));
    const next = harness(client, [encoder.encode(event(client, 'ok') + 'data: [DONE]\n\n')], { history: h.state.messages, input: 'hi' });
    await next.send();
    assert.deepEqual(await readConversation(new Request('https://example.test', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(next.requests[0].body),
    })), [...prior, { role: 'user', content: 'hi' }]);
    next.assertReleased();
  });

  test(`${client.name}: failed partial streams and their errors stay out of subsequent context`, async () => {
    const h = harness(client, [encoder.encode(event(client, 'partial') + 'data: {"error":"boom"}\n\n')]);
    await h.send();
    const next = harness(client, [encoder.encode('data: [DONE]\n\n')], { history: h.state.messages, input: 'hi' });
    await next.send();
    assert.deepEqual(await readConversation(new Request('https://example.test', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(next.requests[0].body),
    })), [{ role: 'user', content: 'hi' }]);
  });
}
