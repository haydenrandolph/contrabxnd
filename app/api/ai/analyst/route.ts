import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const FREE_LIMIT = 5;
const AUTH_LIMIT = 25;

interface SignalContext {
  score: { value: number | null; label: string; components: Record<string, unknown> } | null;
  fedwatch: unknown;
  liquidity: unknown;
  slr: unknown;
  etfFlows: unknown;
  fearGreed: { value: number | null; label: string } | null;
  price: { price: number; change24h?: number } | null;
}

let cachedCtx: { data: SignalContext; ts: number } | null = null;
const CTX_TTL = 60_000;

async function fetchSignalContext(baseUrl: string): Promise<SignalContext> {
  if (cachedCtx && Date.now() - cachedCtx.ts < CTX_TTL) return cachedCtx.data;

  const headers = { 'Content-Type': 'application/json' };
  const [scoreRes, fedwatchRes, liquidityRes, slrRes, etfRes, fgRes, priceRes] =
    await Promise.allSettled([
      fetch(`${baseUrl}/api/signal`, { headers, next: { revalidate: 60 } }).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/fedwatch`, { headers, next: { revalidate: 60 } }).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/liquidity`, { headers, next: { revalidate: 60 } }).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/slr`, { headers, next: { revalidate: 60 } }).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/etf-flows`, { headers, next: { revalidate: 60 } }).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/fear-greed`, { headers, next: { revalidate: 60 } }).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/price`, { headers, next: { revalidate: 60 } }).then(r => r.ok ? r.json() : null),
    ]);

  const data: SignalContext = {
    score: scoreRes.status === 'fulfilled' ? scoreRes.value : null,
    fedwatch: fedwatchRes.status === 'fulfilled' ? fedwatchRes.value : null,
    liquidity: liquidityRes.status === 'fulfilled' ? liquidityRes.value : null,
    slr: slrRes.status === 'fulfilled' ? slrRes.value : null,
    etfFlows: etfRes.status === 'fulfilled' ? etfRes.value : null,
    fearGreed: fgRes.status === 'fulfilled' ? fgRes.value : null,
    price: priceRes.status === 'fulfilled' ? priceRes.value : null,
  };

  cachedCtx = { data, ts: Date.now() };
  return data;
}

function buildSystemPrompt(ctx: SignalContext): string {
  return `You are the Contrabxnd Analyst — a sharp, concise Bitcoin intelligence analyst embedded in the Contrabxnd BIP (Bitcoin Intelligence Platform).

Personality: direct, data-driven, no fluff. Brief sentences, concrete numbers, clear implications. Never use emojis. Never give financial advice or say buy/sell. Frame everything as analysis and signal interpretation.

LIVE DATA:
${JSON.stringify(ctx, null, 2)}

SIGNAL MODEL:
- Contrabxnd Score: -100 (bearish) to +100 (bullish). Components: ETF flows 30%, Net Liquidity 25%, FedWatch 20%, Fear & Greed 10%, SLR 10%, TGA 5%.
- Net Liquidity = WALCL - TGA - RRP. Rising = bullish.
- FedWatch = market-implied Fed rate probabilities. Cuts = bullish.
- SLR regime affects bank balance sheets. Easing = bullish.
- ETF flows = institutional demand via ARKB, IBIT, etc.
- Fear & Greed: 0-25 extreme fear, 75-100 extreme greed.

RULES:
- 2-4 sentences for simple questions. Short paragraph max for complex analysis.
- Reference specific numbers from the data. If data is null, say so.
- No hedging. State analysis with conviction qualified by data.
- Stay in your domain: Bitcoin, macro, markets.`;
}

async function checkRateLimit(
  request: NextRequest
): Promise<{ allowed: boolean; remaining: number; isAuth: boolean; userId: string | null }> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  const supabase = await createClient();
  let userId: string | null = null;
  let isAuth = false;

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      isAuth = true;
    }
  }

  const limit = isAuth ? AUTH_LIMIT : FREE_LIMIT;
  const key = userId || ip;
  const today = new Date().toISOString().slice(0, 10);
  const storageKey = `ai_usage:${key}:${today}`;

  if (supabase) {
    const { data } = await supabase
      .from('ai_usage')
      .select('count')
      .eq('usage_key', storageKey)
      .maybeSingle();

    const count = data?.count ?? 0;
    if (count >= limit) {
      return { allowed: false, remaining: 0, isAuth, userId };
    }

    if (data) {
      await supabase
        .from('ai_usage')
        .update({ count: count + 1 })
        .eq('usage_key', storageKey);
    } else {
      await supabase
        .from('ai_usage')
        .insert({ usage_key: storageKey, count: 1, user_id: userId });
    }

    return { allowed: true, remaining: limit - count - 1, isAuth, userId };
  }

  return { allowed: true, remaining: limit, isAuth, userId };
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

  const rateCheck = await checkRateLimit(request);
  if (!rateCheck.allowed) {
    const msg = rateCheck.isAuth
      ? `Daily limit reached (${AUTH_LIMIT}/day). Resets at midnight UTC.`
      : `Free tier limit reached (${FREE_LIMIT}/day). Sign in for ${AUTH_LIMIT} daily messages.`;
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const baseUrl = request.nextUrl.origin;
  const ctx = await fetchSignalContext(baseUrl);
  const systemPrompt = buildSystemPrompt(ctx);

  const stream = anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: systemPrompt,
    messages: messages.slice(-10).map((m: { role: string; content: string }) => ({
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
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ remaining: rateCheck.remaining })}\n\n`)
        );
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
