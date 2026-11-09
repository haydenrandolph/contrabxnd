#!/usr/bin/env node
// Read-only candidate generator. No database credentials or write path.
import fs from 'node:fs';
import readline from 'node:readline';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const SATS = 100_000_000;
const DAY = 86_400;
const BANDS = [
  ['<1d', 1], ['1d-1w', 7], ['1w-1m', 30], ['1m-3m', 90], ['3m-6m', 180],
  ['6m-1y', 365], ['1y-2y', 730], ['2y-3y', 1095], ['3y-5y', 1825], ['5y+', Infinity],
];

export function validateManifest(manifest, now = Date.now()) {
  if (!manifest || !Number.isSafeInteger(manifest.height) || manifest.height < 0 ||
      manifest.height > 10_000_000 || !/^[a-f0-9]{64}$/.test(manifest.hash) ||
      !Number.isSafeInteger(manifest.timestamp) || manifest.timestamp < 1231006505 ||
      manifest.timestamp > Math.floor(now / 1000) ||
      !/^[a-f0-9]{64}$/.test(manifest.checksum) ||
      !Number.isSafeInteger(manifest.rowCount) || manifest.rowCount <= 0) {
    throw new Error('Invalid manifest: require height, hash, timestamp (block Unix seconds), checksum (SHA-256), rowCount');
  }
  return manifest;
}

export function priceLookup(history) {
  if (!history || typeof history !== 'object' || Array.isArray(history) || !Object.keys(history).length) {
    throw new Error('Price history must be a nonempty date -> USD object');
  }
  const prices = new Map();
  for (const [date, price] of Object.entries(history)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date ||
        typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
      throw new Error(`Invalid price history entry: ${date}`);
    }
    prices.set(date, price);
  }
  return date => {
    if (!prices.has(date)) throw new Error(`Missing BTC/USD price for ${date}; snapshot rejected`);
    return prices.get(date);
  };
}

export async function runIndexer({ env = process.env, fetchFn = fetch, now = Date.now() } = {}) {
  const csv = env.UTXO_CSV || './utxos.csv';
  const manifest = validateManifest(JSON.parse(await fs.promises.readFile(env.UTXO_MANIFEST || `${csv}.manifest.json`, 'utf8')), now);
  const mempool = (env.MEMPOOL_URL || 'http://localhost:3006').replace(/\/+$/, '');
  async function request(path, json = true, headers = {}) {
    const res = await fetchFn(path, { headers, cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Provider request failed: HTTP ${res.status}`);
    return json ? res.json() : (await res.text()).trim();
  }
  async function block(height) {
    const hash = await request(`${mempool}/api/block-height/${height}`, false);
    if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error(`Invalid block hash at ${height}`);
    const data = await request(`${mempool}/api/block/${hash}`);
    if (data.id !== hash || data.height !== height || !Number.isSafeInteger(data.timestamp) ||
        data.timestamp < 1231006505 || data.timestamp > manifest.timestamp + 7200) {
      throw new Error(`Invalid block metadata at ${height}`);
    }
    return { hash, timestamp: data.timestamp };
  }
  // Resolve the dump's block, never the current tip. Old dumps keep their old date.
  const dumpBlock = await block(manifest.height);
  if (dumpBlock.hash !== manifest.hash || dumpBlock.timestamp !== manifest.timestamp) {
    throw new Error('Manifest block hash/timestamp does not match node (wrong dump or reorg)');
  }
  const anchors = [];
  const step = Math.max(1, Math.floor(manifest.height / 250));
  for (let height = 0; height < manifest.height; height += step) {
    anchors.push([height, (await block(height)).timestamp]);
  }
  anchors.push([manifest.height, manifest.timestamp]);
  function heightToTime(height) {
    if (height === 0) return anchors[0][1];
    for (let i = 1; i < anchors.length; i++) {
      if (height <= anchors[i][0]) {
        const [h0, t0] = anchors[i - 1];
        const [h1, t1] = anchors[i];
        return t0 + ((height - h0) / (h1 - h0)) * (t1 - t0);
      }
    }
    throw new Error('Height outside dump');
  }

  let history;
  if (env.BTC_PRICE_HISTORY) {
    history = JSON.parse(await fs.promises.readFile(env.BTC_PRICE_HISTORY, 'utf8'));
  } else {
    if (!env.COINGECKO_PRO_API_KEY) throw new Error('Provision BTC_PRICE_HISTORY or COINGECKO_PRO_API_KEY; no unauthenticated history fallback');
    const data = await request(
      'https://pro-api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=max&interval=daily',
      true, { 'x-cg-pro-api-key': env.COINGECKO_PRO_API_KEY },
    );
    if (!Array.isArray(data.prices) || !data.prices.length) throw new Error('Invalid provider price history');
    history = {};
    for (const point of data.prices) {
      if (!Array.isArray(point) || point.length !== 2 || !Number.isFinite(point[0]) ||
          !Number.isFinite(new Date(point[0]).getTime()) || !Number.isFinite(point[1]) || point[1] < 0) {
        throw new Error('Invalid provider price point');
      }
      history[new Date(point[0]).toISOString().slice(0, 10)] = point[1];
    }
  }
  const priceForDate = priceLookup(history);
  const checksum = createHash('sha256');
  const input = fs.createReadStream(csv);
  input.on('data', chunk => checksum.update(chunk));
  const rl = readline.createInterface({ input, crlfDelay: Infinity });
  let count = 0, rejectedRows = 0, lineNumber = 0, realizedCap = 0;
  let totalSats = 0n;
  const bandBtc = Object.fromEntries(BANDS.map(([name]) => [name, 0]));
  try {
    for await (const line of rl) {
      lineNumber++;
      if (lineNumber === 1 && line === 'height,amount') continue;
      const match = /^(\d+),(\d+)$/.exec(line);
      const height = match ? Number(match[1]) : NaN;
      const sats = match ? Number(match[2]) : NaN;
      if (!Number.isSafeInteger(height) || height > manifest.height ||
          !Number.isSafeInteger(sats) || sats > 21_000_000 * SATS) {
        rejectedRows++;
        continue;
      }
      const timestamp = heightToTime(height);
      if (timestamp > manifest.timestamp) throw new Error(`Row ${lineNumber} creation time after dump`);
      const btc = sats / SATS;
      realizedCap += btc * priceForDate(new Date(timestamp * 1000).toISOString().slice(0, 10));
      totalSats += BigInt(sats);
      const ageDays = (manifest.timestamp - timestamp) / DAY;
      for (const [name, max] of BANDS) {
        if (ageDays < max) { bandBtc[name] += btc; break; }
      }
      count++;
    }
  } finally {
    rl.close();
    input.destroy();
  }
  if (rejectedRows) throw new Error(`CSV rejected: rejectedRows=${rejectedRows}, acceptedRows=${count}`);
  if (checksum.digest('hex') !== manifest.checksum) throw new Error('CSV checksum mismatch');
  if (count !== manifest.rowCount) throw new Error(`CSV rowCount mismatch: expected ${manifest.rowCount}, accepted ${count}`);

  // Sanity-check a full mainnet UTXO dump against the subsidy issued by this height.
  let issued = 0n;
  for (let start = 0, subsidy = 50n * BigInt(SATS); start <= manifest.height && subsidy > 0n; start += 210_000, subsidy /= 2n) {
    issued += BigInt(Math.min(210_000, manifest.height - start + 1)) * subsidy;
  }
  if (!count || totalSats <= 0n || totalSats > issued || totalSats * 10n < issued * 9n) {
    throw new Error('Empty or implausible mainnet supply (require 90%-100% of issued subsidy)');
  }
  const totalSupply = Number(totalSats) / SATS;
  if (!Number.isFinite(realizedCap) || !Number.isFinite(realizedCap / totalSupply)) throw new Error('Nonfinite realized metrics');
  return {
    date: new Date(manifest.timestamp * 1000).toISOString().slice(0, 10),
    block_height: manifest.height,
    total_supply: totalSupply,
    realized_cap: realizedCap,
    realized_price: realizedCap / totalSupply,
    supply_bands: Object.fromEntries(BANDS.map(([name]) => [name, +((bandBtc[name] / totalSupply) * 100).toFixed(2)])),
    source: 'sovereign-utxo-indexer',
    audit: { ...manifest, acceptedRows: count, rejectedRows, heightTimeMethod: 'sampled-interpolation' },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runIndexer().then(row => console.log(JSON.stringify(row, null, 2))).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
