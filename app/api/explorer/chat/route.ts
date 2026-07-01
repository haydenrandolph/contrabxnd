import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { NODE_TOOLS } from '@/lib/node/agent-tools';
import { runAgentStream } from '@/lib/node/agent-run';

export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FREE_LIMIT = 10;
const AUTH_LIMIT = 50;
const MAX_MSG_LENGTH = 500;
const THROTTLE_MS = 2_500;
const MAX_ITERATIONS = 6;

const lastRequestByIp = new Map<string, number>();

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

async function checkRateLimit(request: NextRequest): Promise<{ allowed: boolean; remaining: number; isAuth: boolean }> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const supabase = await createClient();
  let userId: string | null = null;
  let isAuth = false;
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) { userId = user.id; isAuth = true; }
  }
  const limit = isAuth ? AUTH_LIMIT : FREE_LIMIT;
  const key = userId || ip;
  const today = new Date().toISOString().slice(0, 10);
  const storageKey = `explorer_chat:${key}:${today}`;
  if (supabase) {
    const { data } = await supabase.from('ai_usage').select('count').eq('usage_key', storageKey).maybeSingle();
    const count = data?.count ?? 0;
    if (count >= limit) return { allowed: false, remaining: 0, isAuth };
    if (data) await supabase.from('ai_usage').update({ count: count + 1 }).eq('usage_key', storageKey);
    else await supabase.from('ai_usage').insert({ usage_key: storageKey, count: 1, user_id: userId });
    return { allowed: true, remaining: limit - count - 1, isAuth };
  }
  return { allowed: true, remaining: limit, isAuth };
}

function jsonErr(msg: string, status: number) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) return jsonErr('AI not configured', 500);

  const origin = request.headers.get('origin') || '';
  const allowed = ['https://contrabxnd.io', 'https://www.contrabxnd.io', 'http://localhost:3000'];
  if (origin && !allowed.some((o) => origin.startsWith(o))) return jsonErr('Forbidden', 403);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  if (now - (lastRequestByIp.get(ip) || 0) < THROTTLE_MS) return jsonErr('Too fast. Wait a moment.', 429);
  lastRequestByIp.set(ip, now);

  let body: { messages?: Array<{ role: string; content: string }> };
  try { body = await request.json(); } catch { return jsonErr('Bad request', 400); }
  const { messages } = body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) return jsonErr('messages array required', 400);
  const lastMsg = messages[messages.length - 1];
  if (typeof lastMsg?.content === 'string' && lastMsg.content.length > MAX_MSG_LENGTH) {
    return jsonErr(`Message too long (max ${MAX_MSG_LENGTH} chars)`, 400);
  }

  const rate = await checkRateLimit(request);
  if (!rate.allowed) {
    return jsonErr(
      rate.isAuth ? `Daily limit reached (${AUTH_LIMIT}/day). Resets midnight UTC.`
        : `Free limit reached (${FREE_LIMIT}/day). Sign in for ${AUTH_LIMIT}/day.`,
      429,
    );
  }

  const convo: Anthropic.MessageParam[] = messages.slice(-12).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  }));

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        await runAgentStream(
          anthropic,
          { model: 'claude-sonnet-4-6', system: SYSTEM_PROMPT, tools: NODE_TOOLS, messages: convo, maxIterations: MAX_ITERATIONS },
          {
            onText: (delta) => send({ type: 'text', text: delta }),
            onTool: (name) => send({ type: 'tool', name }),
            onToolResult: (name, data) => send({ type: 'tool_result', name, data }),
          },
        );
        send({ type: 'done', remaining: rate.remaining });
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        console.error('Explorer chat error:', err);
        const detail =
          err instanceof Anthropic.APIError
            ? `${err.status ?? ''} ${err.message}`.trim()
            : err instanceof Error ? err.message : 'unknown error';
        send({ type: 'error', error: 'The on-chain analyst hit an error. Try again.', detail });
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  });
}
