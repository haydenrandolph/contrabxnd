import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    schema_version: 'v1',
    name: 'Contrabxnd',
    description: 'Bitcoin Intelligence Platform — live macro signals, derivatives data, on-chain analytics, AI analyst, and agent infrastructure.',
    auth: {
      type: 'api_key',
      header: 'x-api-key',
      prefix: 'cbx_',
      docs: 'https://contrabxnd.io/infra/agents',
    },
    api: {
      type: 'openapi',
      url: 'https://contrabxnd.io/api/v1',
      endpoints: [
        { method: 'GET', path: '/api/v1/price', description: 'BTC price, 24h change, market cap, volume' },
        { method: 'GET', path: '/api/v1/fear-greed', description: 'Fear & Greed Index' },
        { method: 'GET', path: '/api/v1/etf-flows', description: 'Bitcoin ETF flow data by fund' },
        { method: 'GET', path: '/api/v1/fedwatch', description: 'Fed rate probabilities and next meeting' },
        { method: 'GET', path: '/api/v1/liquidity', description: 'Net liquidity, 13w momentum, TGA/RRP trends' },
        { method: 'GET', path: '/api/v1/slr', description: 'Supplementary Leverage Ratio regime' },
        { method: 'GET', path: '/api/v1/derivatives', description: 'Open interest, funding rates, liquidations, L/S ratio' },
        { method: 'GET', path: '/api/v1/calendar', description: 'Upcoming macro events with impact scores' },
        { method: 'GET', path: '/api/v1/polymarket', description: 'Bitcoin prediction market odds' },
        { method: 'GET', path: '/api/v1/agents', description: 'Discover registered agents by capability' },
        { method: 'POST', path: '/api/v1/agents', description: 'Register a new agent' },
        { method: 'GET', path: '/api/v1/agents/credit', description: 'Get agent credit score breakdown' },
        { method: 'POST', path: '/api/v1/agents/predictions', description: 'Submit a hashed prediction' },
        { method: 'GET', path: '/api/v1/agents/predictions', description: 'List agent predictions' },
      ],
    },
    mcp: {
      endpoint: 'https://contrabxnd.io/api/mcp',
      auth: 'Bearer <api_key>',
      tools: 11,
      description: 'MCP server with 11 live tools for Bitcoin intelligence data',
    },
    agent_registry: {
      discover: 'https://contrabxnd.io/api/v1/agents?capability=<tool_name>',
      register: 'https://contrabxnd.io/api/v1/agents',
      credit: 'https://contrabxnd.io/api/v1/agents/credit?agent_id=<id>',
    },
    human_url: 'https://contrabxnd.io/infra/agents',
    contact: 'hank@feelinmoody.io',
  });
}
