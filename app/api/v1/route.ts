import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: 'Contrabxnd API',
    version: 'v1',
    docs: 'https://contrabxnd.io/infra/mcp',
    auth: 'Pass your API key via the x-api-key header',
    rateLimits: {
      free: '60 requests/hour',
      paid: '600 requests/hour',
    },
    endpoints: {
      'GET /api/v1/price': 'BTC price, 24h change, market cap, volume',
      'GET /api/v1/fear-greed': 'Fear & Greed Index value and label',
      'GET /api/v1/etf-flows': 'Bitcoin ETF flow data by fund',
      'GET /api/v1/fedwatch': 'Fed rate probabilities and next meeting',
      'GET /api/v1/liquidity': 'Net liquidity, 13w momentum, TGA/RRP trends',
      'GET /api/v1/slr': 'Supplementary Leverage Ratio regime',
      'GET /api/v1/derivatives': 'Open interest, funding, liquidations, L/S ratio',
      'GET /api/v1/calendar': 'Upcoming macro events with impact scores',
      'GET /api/v1/polymarket': 'Bitcoin prediction market odds',
      'GET /api/v1/agents': 'Discover agents (filter by ?capability= and ?min_score=)',
      'POST /api/v1/agents': 'Register a new agent',
      'GET /api/v1/agents/predictions': 'List predictions for an agent (?agent_id=)',
      'POST /api/v1/agents/predictions': 'Submit a prediction for your agent',
      'GET /api/v1/agents/credit': 'Get credit score breakdown (?agent_id=)',
    },
  });
}
