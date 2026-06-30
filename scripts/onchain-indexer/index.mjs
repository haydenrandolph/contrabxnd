#!/usr/bin/env node
/**
 * Contrabxnd sovereign UTXO indexer.
 *
 * Computes realized cap, realized price, and supply-by-age bands (HODL waves)
 * from the live UTXO set, and upserts the daily aggregate to Supabase. Runs ON
 * the Umbrel (or any host that can read the UTXO CSV + reach your node + Supabase).
 *
 * Pipeline:
 *   1. Read a CSV of the current UTXO set: columns `height,amount` (amount in
 *      sats). Produce it with bitcoin-utxo-dump (see README).
 *   2. Build height -> date by sampling block timestamps from a mempool API
 *      (your node by default) and interpolating.
 *   3. Load daily BTC/USD history (CoinGecko).
 *   4. Stream the CSV: realized_cap += amount_btc * price(date(height));
 *      total_supply += amount_btc; bucket amount_btc into an age band.
 *   5. Upsert today's row into onchain_snapshots.
 *
 * Env:
 *   UTXO_CSV                    path to the height,amount CSV (default ./utxos.csv)
 *   MEMPOOL_URL                 mempool API base (default http://localhost:3006)
 *   SUPABASE_URL                your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY   service-role key (server-side only)
 */
import fs from 'fs';
import readline from 'readline';

const CSV = process.env.UTXO_CSV || './utxos.csv';
const MEMPOOL = (process.env.MEMPOOL_URL || 'http://localhost:3006').replace(/\/+$/, '');
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SATS = 1e8;
const DAY = 86_400;

const BANDS = [
  ['<1d', 1], ['1d-1w', 7], ['1w-1m', 30], ['1m-3m', 90], ['3m-6m', 180],
  ['6m-1y', 365], ['1y-2y', 730], ['2y-3y', 1095], ['3y-5y', 1825], ['5y+', Infinity],
];

async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}
async function getText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return (await r.text()).trim();
}

/** Sample block timestamps and return height -> unix-seconds interpolator. */
async function buildHeightToTime(tip) {
  const samples = Math.min(250, tip);
  const step = Math.max(1, Math.floor(tip / samples));
  const anchors = [];
  for (let h = 0; h <= tip; h += step) {
    const hash = await getText(`${MEMPOOL}/api/block-height/${h}`);
    const blk = await getJson(`${MEMPOOL}/api/block/${hash}`);
    anchors.push([h, blk.timestamp]);
  }
  const tipHash = await getText(`${MEMPOOL}/api/block-height/${tip}`);
  const tipBlk = await getJson(`${MEMPOOL}/api/block/${tipHash}`);
  anchors.push([tip, tipBlk.timestamp]);
  anchors.sort((a, b) => a[0] - b[0]);
  console.log(`  sampled ${anchors.length} block-time anchors`);

  return (height) => {
    if (height <= anchors[0][0]) return anchors[0][1];
    for (let i = 1; i < anchors.length; i++) {
      if (height <= anchors[i][0]) {
        const [h0, t0] = anchors[i - 1];
        const [h1, t1] = anchors[i];
        return t0 + ((height - h0) / (h1 - h0)) * (t1 - t0);
      }
    }
    return anchors[anchors.length - 1][1];
  };
}

/** date(YYYY-MM-DD) -> USD, with nearest-earlier fallback. */
async function loadPrices() {
  const j = await getJson('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=max&interval=daily');
  const map = new Map();
  for (const [ms, price] of j.prices) map.set(new Date(ms).toISOString().slice(0, 10), price);
  const dates = [...map.keys()].sort();
  const earliest = dates[0];
  const earliestPrice = map.get(earliest);
  console.log(`  loaded ${map.size} daily prices (from ${earliest})`);
  return (date) => {
    if (map.has(date)) return map.get(date);
    if (date < earliest) return Math.min(earliestPrice, 0.1); // pre-market coins ~worthless
    // walk back a few days for gaps
    let d = date;
    for (let i = 0; i < 7; i++) {
      const t = new Date(d + 'T00:00:00Z').getTime() - DAY * 1000;
      d = new Date(t).toISOString().slice(0, 10);
      if (map.has(d)) return map.get(d);
    }
    return earliestPrice;
  };
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  if (!fs.existsSync(CSV)) throw new Error(`UTXO CSV not found: ${CSV} (see README to produce it)`);

  console.log('• fetching chain tip…');
  const tip = Number(await getText(`${MEMPOOL}/api/blocks/tip/height`));
  console.log(`  tip height ${tip}`);

  console.log('• building height→date…');
  const heightToTime = await buildHeightToTime(tip);
  console.log('• loading price history…');
  const priceForDate = await loadPrices();

  console.log('• streaming UTXO set…');
  const now = Math.floor(Date.now() / 1000);
  let realizedCap = 0, totalSupply = 0, count = 0;
  const bandBtc = Object.fromEntries(BANDS.map(([n]) => [n, 0]));

  const rl = readline.createInterface({ input: fs.createReadStream(CSV), crlfDelay: Infinity });
  let header = true;
  for await (const line of rl) {
    if (header) { header = false; if (/height/i.test(line)) continue; }
    const comma = line.indexOf(',');
    if (comma < 0) continue;
    const height = parseInt(line.slice(0, comma), 10);
    const sats = parseInt(line.slice(comma + 1), 10);
    if (!Number.isFinite(height) || !Number.isFinite(sats)) continue;

    const btc = sats / SATS;
    const t = heightToTime(height);
    const date = new Date(t * 1000).toISOString().slice(0, 10);
    realizedCap += btc * priceForDate(date);
    totalSupply += btc;

    const ageDays = (now - t) / DAY;
    for (const [name, max] of BANDS) { if (ageDays < max) { bandBtc[name] += btc; break; } }

    if (++count % 5_000_000 === 0) console.log(`  …${(count / 1e6).toFixed(0)}M UTXOs`);
  }

  const supplyBands = {};
  for (const [name] of BANDS) supplyBands[name] = +((bandBtc[name] / totalSupply) * 100).toFixed(2);
  const realizedPrice = realizedCap / totalSupply;
  const date = new Date(now * 1000).toISOString().slice(0, 10);

  console.log(`\n  UTXOs:          ${count.toLocaleString()}`);
  console.log(`  total supply:   ${totalSupply.toFixed(2)} BTC`);
  console.log(`  realized cap:   $${(realizedCap / 1e9).toFixed(1)}B`);
  console.log(`  realized price: $${realizedPrice.toFixed(0)}`);
  console.log(`  HODL waves:     ${JSON.stringify(supplyBands)}`);

  console.log('\n• upserting to Supabase…');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/onchain_snapshots?on_conflict=date`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      date,
      block_height: tip,
      total_supply: totalSupply,
      realized_cap: realizedCap,
      realized_price: realizedPrice,
      supply_bands: supplyBands,
      source: 'sovereign-utxo-indexer',
    }),
  });
  if (!res.ok) throw new Error(`Supabase upsert failed: ${res.status} ${await res.text()}`);
  console.log(`✓ done — onchain_snapshots row for ${date} written.`);
}

main().catch((e) => { console.error('✗', e.message); process.exit(1); });
