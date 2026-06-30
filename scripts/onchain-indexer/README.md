# Contrabxnd Sovereign UTXO Indexer

Computes **realized cap**, **realized price**, and **supply-by-age bands (HODL waves)**
from your own node's UTXO set, then pushes the daily aggregate to Supabase. The
Contrabxnd web app reads that aggregate and derives **MVRV** live against spot price.

Runs **on the Umbrel** (or any host that can read the UTXO dump, reach your
node's mempool API, and reach Supabase + CoinGecko outbound). Nothing heavy runs
on Vercel; only compact daily aggregates leave the node.

## How it works

1. You produce a CSV of the current UTXO set — two columns: `height,amount` (amount in sats).
2. `index.mjs` reconstructs `height → date` by sampling block timestamps from your
   node's mempool API, maps each coin to the BTC price on its creation date,
   and accumulates realized cap + total supply + age bands while streaming the CSV.
3. It upserts one row into `onchain_snapshots` (keyed by date).

## Step 1 — produce the UTXO CSV

Recommended: [`bitcoin-utxo-dump`](https://github.com/in3rsha/bitcoin-utxo-dump)
(reads bitcoind's chainstate directly). It needs **bitcoind stopped** (exclusive
LevelDB access), so run it during a maintenance window:

```bash
# stop the Bitcoin app (Umbrel UI: Bitcoin → Stop, or the app's stop command)
bitcoin-utxo-dump -db ~/.bitcoin/chainstate -f height,amount -o utxos.csv
# restart the Bitcoin app
```

The output `utxos.csv` looks like:
```
height,amount
170,5000000000
181,1000000
...
```

> Alternative (node stays running, advanced): `bitcoin-cli dumptxoutset utxos.dat`
> then convert the binary snapshot to a `height,amount` CSV. Heavier to parse and
> Core-version-sensitive — prefer `bitcoin-utxo-dump` unless you have a parser.

## Step 2 — run the indexer

```bash
export UTXO_CSV=./utxos.csv
export MEMPOOL_URL=http://localhost:3006          # your node's mempool app
export SUPABASE_URL=https://<project>.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

node index.mjs
```

Expected output ends with:
```
  realized price: $XXXXX
  HODL waves:     {"<1d":..., ... "5y+":...}
✓ done — onchain_snapshots row for YYYY-MM-DD written.
```

The web app's `/api/onchain`, the **MVRV** row on the terminal, the Contrabxnd
Score `mvrv` component, and the `get_onchain_metrics` MCP tool all light up
automatically once the first row exists.

## Step 3 — schedule it

Run it on a cron (daily or weekly). Because Step 1 needs the node stopped, weekly
is usually the right cadence — realized cap moves slowly. Example weekly cron:

```cron
0 4 * * 0  cd /path/to/onchain-indexer && ./run-weekly.sh >> indexer.log 2>&1
```

(where `run-weekly.sh` stops bitcoind, dumps the CSV, restarts bitcoind, then runs `node index.mjs`)

## Notes / accuracy

- **Migration:** run `supabase/migrations/012_onchain_snapshots.sql` against the DB first.
- `height → date` is interpolated from ~250 sampled block timestamps — accurate to
  well under a day, which is plenty for daily-granularity price assignment.
- Pre-market coins (before price history begins) are valued ~$0.10, a negligible
  share of realized cap.
- First run streams ~180M UTXOs; expect a few minutes of CPU. Memory stays flat
  (the CSV is streamed line-by-line).
