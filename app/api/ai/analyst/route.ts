import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { AiRequestError, consumeAiQuota, readConversation } from '@/lib/ai-quota';
import { NODE_TOOLS } from '@/lib/node/agent-tools';
import { runAgentStream } from '@/lib/node/agent-run';
import { chatBaseUrl, chatRequestSignal, chatStream, isAllowedChatOrigin, waitForChatWork } from '@/lib/chat-request';

export const maxDuration = 60;

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

async function fetchSignalContext(baseUrl: string, requestSignal: AbortSignal): Promise<SignalContext> {
  requestSignal.throwIfAborted();
  if (cachedCtx && Date.now() - cachedCtx.ts < CTX_TTL) return cachedCtx.data;

  const signal = AbortSignal.any([requestSignal, AbortSignal.timeout(8_000)]);
  const headers = { 'Content-Type': 'application/json' };
  const [scoreRes, fedwatchRes, liquidityRes, slrRes, etfRes, fgRes, priceRes] =
    await Promise.allSettled([
      fetch(`${baseUrl}/api/signal`, { headers, signal, next: { revalidate: 60 } }).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/fedwatch`, { headers, signal, next: { revalidate: 60 } }).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/liquidity`, { headers, signal, next: { revalidate: 60 } }).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/slr`, { headers, signal, next: { revalidate: 60 } }).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/etf-flows`, { headers, signal, next: { revalidate: 60 } }).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/fear-greed`, { headers, signal, next: { revalidate: 60 } }).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/price`, { headers, signal, next: { revalidate: 60 } }).then(r => r.ok ? r.json() : null),
    ]);
  requestSignal.throwIfAborted();

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

LIVE DATA (refreshed every 60s):
${JSON.stringify(ctx, null, 2)}

A daily AI-generated intelligence brief is published at 14:00 UTC. If users ask about today's brief or the daily report, reference the data above to provide the same quality of analysis.

SIGNAL MODEL:
- Contrabxnd Score: -100 (bearish) to +100 (bullish). Components: ETF flows 25%, Net Liquidity 25%, FedWatch 20%, Polymarket 10%, Fear & Greed 10%, SLR 5%, TGA 5%.
- Net Liquidity = WALCL - TGA - RRP. Rising = bullish.
- FedWatch = market-implied Fed rate probabilities. Cuts = bullish.
- SLR regime affects bank balance sheets. Easing = bullish.
- ETF flows = institutional demand via ARKB, IBIT, etc.
- Fear & Greed: 0-25 extreme fear, 75-100 extreme greed.
- Polymarket = prediction market probabilities for Bitcoin price targets, reserve policy, etc. Higher avg "Yes" = market expects bullish catalysts.

ON-CHAIN TOOLS: You can query the Contrabxnd sovereign Bitcoin node directly. When the user asks about a specific address, transaction, block, the mempool, fees, fund flows, or a script, call the provided tools to fetch real data — never invent balances, txids, or block details. Use them alongside the macro data above.

RULES:
- 2-4 sentences for simple questions. Short paragraph max for complex analysis.
- Reference specific numbers from the data. If data is null, say so.
- No hedging. State analysis with conviction qualified by data.
- No emoji or markdown tables — replies render as plain text.
- Stay in your domain: Bitcoin, macro, markets, and on-chain data.`;
}

function jsonErr(msg: string, status: number) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: NextRequest) {
  const cancellation = new AbortController();
  const signal = chatRequestSignal(request, cancellation);
  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonErr('AI service unavailable', 503);
  }

  if (!isAllowedChatOrigin(request.headers.get('origin'))) {
    return jsonErr('Forbidden', 403);
  }

  let messages;
  let rateCheck;
  try {
    messages = await waitForChatWork(signal, () => readConversation(request));
    rateCheck = await waitForChatWork(signal, async () => {
      const client = await createClient();
      signal.throwIfAborted();
      return consumeAiQuota(request, 'analyst', client, createAdminClient());
    });
  } catch (error) {
    if (signal.aborted) return jsonErr('Request cancelled or timed out', request.signal.aborted ? 499 : 504);
    return jsonErr(error instanceof AiRequestError ? error.message : 'AI service unavailable',
      error instanceof AiRequestError ? error.status : 503);
  }
  if (!rateCheck.allowed) {
    if (rateCheck.retryAfter) return jsonErr('Too fast. Wait a moment.', 429);
    const msg = rateCheck.isAuth
      ? `Daily limit reached (${AUTH_LIMIT}/day). Resets at midnight UTC.`
      : `Free tier limit reached (${FREE_LIMIT}/day). Sign in for ${AUTH_LIMIT} daily messages.`;
    return jsonErr(msg, 429);
  }

  // Do not use the caller-controlled Host header for server-side data fetches.
  let ctx;
  try {
    ctx = await waitForChatWork(signal, () => fetchSignalContext(chatBaseUrl(), signal));
  } catch {
    return jsonErr('Request cancelled or timed out', request.signal.aborted ? 499 : 504);
  }
  const systemPrompt = buildSystemPrompt(ctx);

  const convo: Anthropic.MessageParam[] = messages.slice(-10);
  if (convo[0]?.role === 'assistant') convo.shift();
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 55_000, maxRetries: 0 });

  const readable = chatStream(cancellation, signal, async (enc) => {
    await runAgentStream(
      anthropic,
      { model: 'claude-haiku-4-5-20251001', system: systemPrompt, tools: NODE_TOOLS, messages: convo, maxTokens: 700, signal },
      { onText: (delta) => enc({ text: delta }) },
    );
    enc({ remaining: rateCheck.remaining });
  }, { error: 'The analyst is unavailable. Try again later.' });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
