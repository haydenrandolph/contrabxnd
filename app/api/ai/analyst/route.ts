import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface SignalContext {
  score: { value: number | null; label: string; components: Record<string, unknown> } | null;
  fedwatch: unknown;
  liquidity: unknown;
  slr: unknown;
  etfFlows: unknown;
  fearGreed: { value: number | null; label: string } | null;
  price: { price: number; change24h?: number } | null;
  network: {
    blockHeight: number;
    hashRate: number;
    mempoolCount: number;
    priorityFee: number;
    marketCap: number;
    volume24h: number;
  } | null;
}

async function fetchSignalContext(baseUrl: string): Promise<SignalContext> {
  const headers = { 'Content-Type': 'application/json' };

  const [scoreRes, fedwatchRes, liquidityRes, slrRes, etfRes, fgRes, priceRes] =
    await Promise.allSettled([
      fetch(`${baseUrl}/api/signal`, { headers }).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/fedwatch`, { headers }).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/liquidity`, { headers }).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/slr`, { headers }).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/etf-flows`, { headers }).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/fear-greed`, { headers }).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/price`, { headers }).then(r => r.ok ? r.json() : null),
    ]);

  return {
    score: scoreRes.status === 'fulfilled' ? scoreRes.value : null,
    fedwatch: fedwatchRes.status === 'fulfilled' ? fedwatchRes.value : null,
    liquidity: liquidityRes.status === 'fulfilled' ? liquidityRes.value : null,
    slr: slrRes.status === 'fulfilled' ? slrRes.value : null,
    etfFlows: etfRes.status === 'fulfilled' ? etfRes.value : null,
    fearGreed: fgRes.status === 'fulfilled' ? fgRes.value : null,
    price: priceRes.status === 'fulfilled' ? priceRes.value : null,
    network: null,
  };
}

function buildSystemPrompt(ctx: SignalContext): string {
  return `You are the Contrabxnd Analyst — a sharp, concise Bitcoin intelligence analyst embedded in the Contrabxnd BIP (Bitcoin Intelligence Platform). You have access to live market data and proprietary signal analysis.

Your personality: direct, data-driven, no fluff. You speak like a Bloomberg terminal analyst — brief sentences, concrete numbers, clear implications. Never use emojis. Never give financial advice or tell users to buy/sell. Frame everything as analysis and signal interpretation.

CURRENT MARKET DATA (live):
${JSON.stringify(ctx, null, 2)}

SIGNAL MODEL CONTEXT:
- The Contrabxnd Score ranges from -100 (extremely bearish) to +100 (extremely bullish)
- Score components: ETF flows (30% weight), Net Liquidity (25%), FedWatch (20%), Fear & Greed (10%), SLR regime (10%), TGA balance (5%)
- Net Liquidity = Fed Balance Sheet (WALCL) - Treasury General Account (TGA) - Reverse Repo (RRP). Rising liquidity is bullish.
- FedWatch shows market-implied probabilities for Fed rate decisions. Rate cuts are bullish for risk assets.
- SLR (Supplementary Leverage Ratio) regime affects bank balance sheet capacity. Easing is bullish for liquidity.
- ETF flows track institutional Bitcoin demand via spot ETFs (ARKB, IBIT, etc.). Positive net flows = institutional accumulation.
- Fear & Greed index: 0-25 extreme fear, 25-50 fear, 50-75 greed, 75-100 extreme greed.

RULES:
- Be concise. 2-4 sentences for simple questions, up to a short paragraph for complex analysis.
- Always ground your analysis in the actual data above. Reference specific numbers.
- If data is missing or null, say so — don't fabricate.
- Never say "I think" or hedge excessively. State analysis with conviction, qualified by the data.
- If asked about something outside Bitcoin/macro, briefly redirect to your domain.
- Use plain language but don't dumb it down. Your users are serious about Bitcoin.`;
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { messages } = await request.json();
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: 'messages array required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const baseUrl = request.nextUrl.origin;
  const ctx = await fetchSignalContext(baseUrl);
  const systemPrompt = buildSystemPrompt(ctx);

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: err instanceof Error ? err.message : 'Stream error' })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
