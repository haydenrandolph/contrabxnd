import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { NODE_TOOLS, runNodeTool } from '@/lib/node/agent-tools';

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

  const toolsUsed: string[] = [];
  try {
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const resp = await anthropic.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: NODE_TOOLS,
        messages: convo,
      });
      convo.push({ role: 'assistant', content: resp.content });

      if (resp.stop_reason !== 'tool_use') {
        const answer = resp.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('\n')
          .trim();
        return new Response(JSON.stringify({ answer: answer || '(no response)', tools_used: toolsUsed, remaining: rate.remaining }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of resp.content) {
        if (block.type === 'tool_use') {
          toolsUsed.push(block.name);
          const result = await runNodeTool(block.name, block.input as Record<string, unknown>);
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
        }
      }
      convo.push({ role: 'user', content: toolResults });
    }
    return new Response(JSON.stringify({ answer: 'That query needed too many lookups — try narrowing it.', tools_used: toolsUsed, remaining: rate.remaining }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Explorer chat error:', err);
    return jsonErr('The on-chain analyst hit an error. Try again.', 502);
  }
}
