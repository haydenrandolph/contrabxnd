import type { Metadata } from 'next';
import DocsShell from '@/components/docs/DocsShell';

export const metadata: Metadata = {
  title: 'MCP Tool Reference — Contrabxnd Docs',
  description: 'Every Contrabxnd MCP tool, grouped by capability.',
};

const GROUPS: { title: string; tools: [string, string][] }[] = [
  {
    title: 'Intelligence',
    tools: [
      ['get_signal_score', 'Composite Contrabxnd Score (-100…+100) with every component breakdown.'],
      ['get_bitcoin_price', 'Live BTC price, 24h change, market cap, volume.'],
      ['get_net_liquidity', 'Fed balance sheet, TGA, reverse repo, M2, 13-week momentum.'],
      ['get_fedwatch', 'FOMC rate cut/hold/hike probabilities.'],
      ['get_etf_flows', 'ARKB / IBIT flow data.'],
      ['get_polymarket', 'Bitcoin prediction-market odds.'],
      ['get_fear_greed', 'Fear & Greed index.'],
      ['get_slr', 'SLR regime and leverage conditions.'],
      ['get_market_brief', 'All signals combined in one call.'],
      ['get_daily_brief', 'AI-generated daily intelligence brief.'],
      ['get_bitcoin_history', 'Historical BTC price for a date range.'],
    ],
  },
  {
    title: 'Mining & On-Chain',
    tools: [
      ['get_mining_intelligence', 'Hash Ribbon state, difficulty ribbon, next adjustment forecast.'],
      ['get_onchain_metrics', 'Realized price, MVRV, HODL waves (sovereign UTXO indexer).'],
    ],
  },
  {
    title: 'Indexer (node)',
    tools: [
      ['query_address', 'Balance, total received/sent, tx count, unconfirmed activity.'],
      ['query_transaction', 'Full tx: inputs, outputs, fee, confirmations.'],
      ['query_block', 'Block by height or hash: miner, size, weight, difficulty.'],
      ['get_mempool_analysis', 'Pending count, mempool size, recommended fees.'],
      ['estimate_fee', 'sat/vB for next-block / 30m / 1h / economy.'],
      ['get_address_history', 'Recent transaction history for an address.'],
      ['trace_funds', 'Follow BTC forward through the transaction graph.'],
      ['decode_script', 'Decode a scriptPubKey into ASM + type.'],
    ],
  },
  {
    title: 'Lightning',
    tools: [
      ['get_node_info', 'Node pubkey, alias, channels, peers, connect URIs.'],
      ['get_lightning_balance', 'Channel + on-chain balances.'],
      ['list_channels', 'Active channels with capacity and balances.'],
      ['create_invoice', 'Generate a BOLT11 invoice to receive sats.'],
      ['decode_invoice', 'Decode a BOLT11 payment request.'],
    ],
  },
  {
    title: 'L402 Micropayments',
    tools: [['get_pricing', 'List paywalled resources and their sat prices.']],
  },
];

export default function McpToolsDoc() {
  return (
    <DocsShell slug="mcp/tools" title="Tool Reference" subtitle="Every MCP tool exposed by the Contrabxnd server, grouped by capability.">
      {GROUPS.map((g) => (
        <div key={g.title}>
          <h2>{g.title}</h2>
          <ul>
            {g.tools.map(([name, desc]) => (
              <li key={name}><code>{name}</code> — {desc}</li>
            ))}
          </ul>
        </div>
      ))}
    </DocsShell>
  );
}
