import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyPolicySignal, scrapeSlr } from './scraper';

test('SLR policy classification rejects ambiguous text rather than favor easing', () => {
  const item = { title: '', link: '', description: '', pubDate: '' };
  assert.equal(classifyPolicySignal({ ...item, title: 'SLR relief to lower requirements' }), 1);
  assert.equal(classifyPolicySignal({ ...item, title: 'SLR stricter capital requirements' }), -1);
  assert.equal(classifyPolicySignal({ ...item, title: 'SLR relief and stricter requirements' }), null);
  assert.equal(classifyPolicySignal({ ...item, title: 'SLR discussion' }), null);
});

test('RSS failure and absence of policy news return unknown, not bullish', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 503 }));
  assert.equal((await scrapeSlr()).policy_signal, null);
  t.mock.method(globalThis, 'fetch', async () => new Response('<rss><channel></channel></rss>'));
  assert.equal((await scrapeSlr()).policy_signal, null);
});
