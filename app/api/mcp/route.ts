import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.contrabxnd.io';

async function fetchInternal(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

function createServer() {
  const server = new McpServer({
    name: 'contrabxnd',
    version: '1.0.0',
  });

  server.tool(
    'get_signal_score',
    'Get the composite Contrabxnd Score (-100 bearish to +100 bullish) with all component breakdowns',
    {},
    async () => {
      const data = await fetchInternal('/api/signal');
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    'get_bitcoin_price',
    'Get current Bitcoin price, 24h change, and market data',
    {},
    async () => {
      const data = await fetchInternal('/api/price');
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    'get_net_liquidity',
    'Get net liquidity data: Fed balance sheet (WALCL), TGA, reverse repo, M2, bank reserves, 13-week momentum',
    {},
    async () => {
      const data = await fetchInternal('/api/liquidity');
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    'get_fedwatch',
    'Get FedWatch rate probabilities: cut/hold/hike odds for upcoming FOMC meetings, current fed funds rate',
    {},
    async () => {
      const data = await fetchInternal('/api/fedwatch');
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    'get_etf_flows',
    'Get Bitcoin ETF flow data: ARKB, IBIT shares outstanding, NAV, net inflows/outflows',
    {},
    async () => {
      const data = await fetchInternal('/api/etf-flows');
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    'get_polymarket',
    'Get Polymarket prediction market data for Bitcoin: market questions, Yes/No probabilities, volume, avg bull probability',
    {},
    async () => {
      const data = await fetchInternal('/api/polymarket');
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    'get_fear_greed',
    'Get Bitcoin Fear & Greed Index (0-100): 0-25 extreme fear, 75-100 extreme greed',
    {},
    async () => {
      const data = await fetchInternal('/api/fear-greed');
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    'get_slr',
    'Get SLR (Supplementary Leverage Ratio) regime data: policy signal, leverage subindex, easing/tightening status',
    {},
    async () => {
      const data = await fetchInternal('/api/slr');
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    'get_market_brief',
    'Get a comprehensive market intelligence brief combining all signals: score, liquidity, FedWatch, ETF flows, Polymarket, fear & greed, SLR',
    {},
    async () => {
      const [signal, liquidity, fedwatch, etf, polymarket, fearGreed, slr, price] = await Promise.allSettled([
        fetchInternal('/api/signal'),
        fetchInternal('/api/liquidity'),
        fetchInternal('/api/fedwatch'),
        fetchInternal('/api/etf-flows'),
        fetchInternal('/api/polymarket'),
        fetchInternal('/api/fear-greed'),
        fetchInternal('/api/slr'),
        fetchInternal('/api/price'),
      ]);

      const brief = {
        timestamp: new Date().toISOString(),
        price: price.status === 'fulfilled' ? price.value : null,
        signal: signal.status === 'fulfilled' ? signal.value : null,
        liquidity: liquidity.status === 'fulfilled' ? liquidity.value : null,
        fedwatch: fedwatch.status === 'fulfilled' ? fedwatch.value : null,
        etf_flows: etf.status === 'fulfilled' ? etf.value : null,
        polymarket: polymarket.status === 'fulfilled' ? polymarket.value : null,
        fear_greed: fearGreed.status === 'fulfilled' ? fearGreed.value : null,
        slr: slr.status === 'fulfilled' ? slr.value : null,
      };

      return { content: [{ type: 'text' as const, text: JSON.stringify(brief, null, 2) }] };
    },
  );

  server.tool(
    'get_bitcoin_history',
    'Get historical Bitcoin price data for a date range',
    { start_date: z.string().describe('Start date (YYYY-MM-DD)'), end_date: z.string().describe('End date (YYYY-MM-DD)') },
    async ({ start_date, end_date }) => {
      const data = await fetchInternal(`/api/bitcoin-history?start=${start_date}&end=${end_date}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    },
  );

  return server;
}

async function handleMcpRequest(req: Request): Promise<Response> {
  const server = createServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);

  try {
    return await transport.handleRequest(req);
  } finally {
    await transport.close();
    await server.close();
  }
}

export async function POST(req: Request) {
  return handleMcpRequest(req);
}

export async function GET(req: Request) {
  return handleMcpRequest(req);
}

export async function DELETE(req: Request) {
  return handleMcpRequest(req);
}
