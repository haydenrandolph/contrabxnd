import test from 'node:test';
import assert from 'node:assert/strict';

test('public mining fallback retains its true source and rejects invalid public history', async t => {
  const oldNode = process.env.NODE_MEMPOOL_URL;
  delete process.env.NODE_MEMPOOL_URL;
  t.after(() => { if (oldNode !== undefined) process.env.NODE_MEMPOOL_URL = oldNode; });
  const { getMiningIntelligence } = await import('../hashrate/index');
  const now = Date.parse('2026-11-08T12:00:00Z');
  t.mock.method(Date, 'now', () => now);
  let valid = true;
  t.mock.method(globalThis, 'fetch', async (url: string) => Response.json(url.includes('/hashrate/') ? {
    hashrates: valid ? Array.from({ length: 90 }, (_, i) => ({ timestamp: now / 1000 - (89 - i) * 86400, avgHashrate: 1e21 })) : [],
    difficulty: [{ time: now / 1000 - 100 * 86400, height: 900000, difficulty: 1e14, adjustment: 0 }],
    currentHashrate: 1e21, currentDifficulty: 1e14,
  } : {
    progressPercent: 50, difficultyChange: 1, remainingBlocks: 1008,
    estimatedRetargetDate: now + 7 * 86400_000, nextRetargetHeight: 901152, timeAvg: 600_000,
  }));
  assert.equal((await getMiningIntelligence()).source, 'public');
  valid = false;
  await assert.rejects(getMiningIntelligence(), /Invalid mining data/);
});
