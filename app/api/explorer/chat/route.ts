import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { AiRequestError, consumeAiQuota, readConversation } from '@/lib/ai-quota';
import { NODE_TOOLS } from '@/lib/node/agent-tools';
import { runAgentStream } from '@/lib/node/agent-run';
import { chatRequestSignal, chatStream, isAllowedChatOrigin, waitForChatWork } from '@/lib/chat-request';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const FREE_LIMIT = 10;
const AUTH_LIMIT = 50;
const MAX_ITERATIONS = 6;

const SYSTEM_PROMPT = `You are the Contrabxnd on-chain analyst — a conversational Bitcoin block explorer. Answer questions about addresses, transactions, blocks, the mempool, fees, fund flows, and scripts by calling the provided tools against Contrabxnd's own sovereign Bitcoin node.

Rules:
- Always use the tools to fetch real data. Never invent balances, txids, block details, or numbers.
- Lead with the answer, then any supporting detail. Answer directly and concisely — no exploratory reasoning in your reply.
- Format BTC amounts clearly (e.g. "1.25 BTC"); mention sat/vB for fees.
- You can chain tools: e.g. look up an address, then inspect a transaction from its history, or trace funds from a txid across hops.
- If a lookup errors or returns nothing, say so plainly.
- Stay in the Bitcoin on-chain domain. No price predictions or financial advice.
- Write plain prose. No emoji, no markdown tables — the reply renders as plain text.
- Keep replies to a few sentences unless the user explicitly asks for more depth.`;

function jsonErr(msg: string, status: number) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(request: NextRequest) {
  const cancellation = new AbortController();
  const signal = chatRequestSignal(request, cancellation);
  if (!process.env.ANTHROPIC_API_KEY) return jsonErr('AI service unavailable', 503);

  if (!isAllowedChatOrigin(request.headers.get('origin'))) return jsonErr('Forbidden', 403);

  let messages;
  let rate;
  try {
    messages = await waitForChatWork(signal, () => readConversation(request));
    rate = await waitForChatWork(signal, async () => {
      const client = await createClient();
      signal.throwIfAborted();
      return consumeAiQuota(request, 'explorer', client, createAdminClient());
    });
  } catch (error) {
    if (signal.aborted) return jsonErr('Request cancelled or timed out', request.signal.aborted ? 499 : 504);
    return jsonErr(error instanceof AiRequestError ? error.message : 'AI service unavailable',
      error instanceof AiRequestError ? error.status : 503);
  }
  if (!rate.allowed) {
    if (rate.retryAfter) return jsonErr('Too fast. Wait a moment.', 429);
    return jsonErr(
      rate.isAuth ? `Daily limit reached (${AUTH_LIMIT}/day). Resets midnight UTC.`
        : `Free limit reached (${FREE_LIMIT}/day). Sign in for ${AUTH_LIMIT}/day.`,
      429,
    );
  }

  const convo: Anthropic.MessageParam[] = messages.slice(-12);
  if (convo[0]?.role === 'assistant') convo.shift();
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 55_000, maxRetries: 0 });

  const readable = chatStream(cancellation, signal, async (send) => {
    await runAgentStream(
      anthropic,
      { model: 'claude-sonnet-4-6', system: SYSTEM_PROMPT, tools: NODE_TOOLS, messages: convo, maxIterations: MAX_ITERATIONS, signal },
      {
        onText: (delta) => send({ type: 'text', text: delta }),
        onTool: (name) => send({ type: 'tool', name }),
        onToolResult: (name, data) => send({ type: 'tool_result', name, data }),
      },
    );
    send({ type: 'done', remaining: rate.remaining });
  }, { type: 'error', error: 'The on-chain analyst hit an error. Try again.' });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
