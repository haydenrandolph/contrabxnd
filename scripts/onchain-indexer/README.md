# Read-Only Sovereign UTXO Indexer

Produces a JSON **candidate**, never a database write. No Supabase credentials,
automatic publishing, node stop/start, or scheduling is performed by this script.
Review the candidate independently before any separate ingestion process.

## Inputs

Export a full mainnet UTXO CSV with exactly `height,amount` columns (amount in
integer satoshis). The exact header is optional. Blank, negative, fractional,
extra-column, unsafe-integer and out-of-snapshot-height rows are rejected and
counted; any rejected row fails the entire run. Empty/zero supply and supply
outside 90%-100% of issued subsidy at the dump height also fail. This is a coarse
sanity check, not proof that the dump is complete.

For example, `bitcoin-utxo-dump -db ~/.bitcoin/chainstate -f height,amount -o utxos.csv`
requires exclusive chainstate access with bitcoind stopped. Follow the exporter
and Bitcoin Core documentation. Do not run this against a changing chainstate.

Capture the dump's height and block hash **at export time**, not at indexer run
time. Use `getblockheader <dump-hash>` for its block timestamp. Provision a JSON
manifest at `utxos.csv.manifest.json` (or set `UTXO_MANIFEST`):

```json
{
  "height": 900000,
  "hash": "<64 lowercase hex characters: dump block hash>",
  "timestamp": 1740000000,
  "checksum": "<64 lowercase hex characters: SHA-256 of exact CSV bytes>",
  "rowCount": 180000000
}
```

The values above are illustrative, not a usable manifest. `timestamp` is Unix
seconds of the dump block, **not** export wall-clock time. `rowCount` excludes the
optional header. Obtain the checksum with `shasum -a 256 utxos.csv` and the data
row count from the exporter or an independent strict CSV validation. The manifest
binds bytes and metadata but is not signed; the operator must establish provenance.
The node must still map that height to the manifest hash/timestamp, or the run fails.
Old dumps retain their historical UTC block date and height, never today's date/tip.

Provision daily BTC/USD prices as a JSON object via `BTC_PRICE_HISTORY`:

```json
{ "2009-01-03": 0, "2010-07-17": 0.05 }
```

This example is deliberately incomplete. Every assigned creation date must exist.
Zero is allowed only when explicitly provisioned (for an operator-reviewed
pre-market valuation policy); no implicit pre-market price, lookback, forward-fill,
or earliest-price substitution exists. Missing dates fail closed. Alternatively,
set `COINGECKO_PRO_API_KEY` for authenticated Pro daily history; plan entitlements
and pre-market coverage may still be insufficient. Local history takes precedence.
There is no unauthenticated `days=max` request or public node fallback.

## Invocation

From the repository root, with Node 24:

```bash
UTXO_CSV=/data/utxos.csv \
UTXO_MANIFEST=/data/utxos.csv.manifest.json \
BTC_PRICE_HISTORY=/data/btc-usd-daily.json \
MEMPOOL_URL=http://localhost:3006 \
node scripts/onchain-indexer/index.mjs
```

Success prints candidate JSON to stdout including manifest provenance, accepted
and rejected row counts. Failure prints an error to stderr and exits nonzero,
without printing a candidate. Each node/provider request has an 8-second deadline,
including body reads. No request to the live tip is made.

Offline deterministic regression tests (no live providers or database):

```bash
node --test scripts/provider-indexer.test.mjs
```

## Limitations

- Creation times remain interpolated from approximately 250 block anchors. This
  can assign the wrong daily price or age band near boundaries; these metrics are
  estimates, not an exact realized-cap index. Exact per-height timestamps are a
  future improvement. Nonmonotonic timestamps can cause conservative rejection.
- Checksums, row counts and supply bounds cannot prove chainstate authenticity,
  completeness, or the quality of provisioned prices. No outpoint deduplication is
  possible with this two-column format.
- CSV processing remains streaming; price history and block anchors reside in
  memory. Network calls are bounded individually, not by a whole-job deadline.
- `lib/node/client.ts` retains `node`/`public` source labels. For application-side
  privacy, set `NODE_PUBLIC_FALLBACK=false` to prohibit public fallback, including
  when no sovereign node is configured. Its default remains public fallback.
