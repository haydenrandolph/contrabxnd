// Server-side request validation and quota enforcement. Clients never receive
// database credentials or write usage rows; callers pass server-created clients.
import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import type { SupabaseClient } from '@supabase/supabase-js';

export class AiRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export interface ChatMessage { role: 'user' | 'assistant'; content: string }

const MAX_BODY_BYTES = 65_536;

export async function readConversation(request: Request): Promise<ChatMessage[]> {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new AiRequestError('JSON body required', 415);
  }
  const declaredLength = request.headers.get('content-length');
  if (declaredLength && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > MAX_BODY_BYTES)) {
    throw new AiRequestError('Request body too large', 413);
  }
  if (!request.body) throw new AiRequestError('Bad request', 400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => {});
        throw new AiRequestError('Request body too large', 413);
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof AiRequestError) throw error;
    throw new AiRequestError('Bad request', 400);
  } finally {
    reader.releaseLock();
  }
  let body: unknown;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new AiRequestError('Bad request', 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new AiRequestError('Bad request', 400);
  const { messages, _hp } = body as Record<string, unknown>;
  if (_hp !== undefined && _hp !== '') throw new AiRequestError('Bad request', 400);
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 100) {
    throw new AiRequestError('messages must contain 1 to 100 entries', 400);
  }
  let total = 0;
  const conversation: ChatMessage[] = messages.map((message: unknown) => {
    if (!message || typeof message !== 'object' || Array.isArray(message)) throw new AiRequestError('Invalid message', 400);
    const { role, content } = message as Record<string, unknown>;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string' || !content.trim()) {
      throw new AiRequestError('Messages require a user/assistant role and nonempty text', 400);
    }
    const max = role === 'user' ? 500 : 8_000;
    total += content.length;
    if (content.length > max || total > 32_000) throw new AiRequestError('Conversation too long', 400);
    return { role, content };
  });
  if (conversation[0].role !== 'user' || conversation.at(-1)?.role !== 'user') {
    throw new AiRequestError('Conversation must start and end with a user message', 400);
  }
  return conversation;
}

export async function consumeAiQuota(
  request: Request,
  scope: 'analyst' | 'explorer',
  session: SupabaseClient | null,
  admin: SupabaseClient | null,
): Promise<{ allowed: boolean; remaining: number; retryAfter: number; isAuth: boolean }> {
  if (!session || !admin) throw new AiRequestError('AI quota service unavailable', 503);
  try {
    const { data: { user }, error: authError } = await session.auth.getUser();
    // Missing cookies are normal for anonymous users; auth/storage outages are not.
    if (authError && authError.name !== 'AuthSessionMissingError') throw authError;
    // Only trust the deployment platform's overwritten forwarding header.
    // Other hosts share an anonymous bucket until a trusted proxy is configured.
    const forwarded = process.env.VERCEL === '1' ? request.headers.get('x-vercel-forwarded-for') : null;
    const candidate = forwarded?.split(',')[0]?.trim() ?? '';
    // Without a trustworthy address, share a conservative bucket instead of
    // allowing caller-controlled junk to create unlimited anonymous identities.
    const family = isIP(candidate);
    const ip = family === 6 ? new URL(`http://[${candidate}]/`).hostname : family === 4 ? candidate : 'unknown';
    const subject = createHash('sha256').update(ip).digest('hex');
    const { data, error } = await admin.rpc('consume_ai_quota', {
      p_scope: scope, p_subject: subject, p_user_id: user?.id ?? null,
    });
    if (error || !Array.isArray(data) || data.length !== 1) throw new Error('Quota RPC failed');
    const row = data[0];
    const limit = scope === 'analyst' ? (user ? 25 : 5) : (user ? 50 : 10);
    if (!row || typeof row.allowed !== 'boolean' || !Number.isInteger(row.remaining) ||
        row.remaining < 0 || row.remaining >= limit || !Number.isInteger(row.retry_after) ||
        row.retry_after < 0 || row.retry_after > 3 ||
        (row.allowed && row.retry_after !== 0) || (!row.allowed && row.remaining > 0 && row.retry_after === 0)) {
      throw new Error('Invalid quota RPC response');
    }
    return { allowed: row.allowed, remaining: row.remaining, retryAfter: row.retry_after, isAuth: !!user };
  } catch {
    throw new AiRequestError('AI quota service unavailable', 503);
  }
}
