const CHAT_DEADLINE_MS = 55_000;

function configuredOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password
      || url.pathname !== '/' || url.search || url.hash
      || (value !== url.origin && value !== `${url.origin}/`)) return null;
    return url.origin;
  } catch { return null; }
}

function configuredOrigins(): string[] {
  const vercel = process.env.VERCEL_URL;
  return [
    configuredOrigin(process.env.NEXT_PUBLIC_APP_URL),
    configuredOrigin(vercel && (vercel.includes('://') ? vercel : `https://${vercel}`)),
  ].filter((origin): origin is string => origin !== null);
}

export function isAllowedChatOrigin(origin: string | null): boolean {
  if (!origin) return true;
  // Origin headers must be exact serialized origins, not URLs with paths or prefixes.
  if (configuredOrigin(origin) !== origin) return false;
  const url = new URL(origin);
  if (['localhost', '127.0.0.1'].includes(url.hostname)) return process.env.NODE_ENV === 'development';
  if (['https://contrabxnd.io', 'https://www.contrabxnd.io', ...configuredOrigins()].includes(origin)) return true;
  return false;
}

export function chatBaseUrl(): string {
  return configuredOrigins()[0]
    ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://contrabxnd.io');
}

export function chatRequestSignal(request: Request, cancellation: AbortController): AbortSignal {
  return AbortSignal.any([request.signal, cancellation.signal, AbortSignal.timeout(CHAT_DEADLINE_MS)]);
}

/** Stop waiting even for work (quota or nested tools) that cannot accept a signal. */
export async function waitForChatWork<T>(signal: AbortSignal, work: () => Promise<T>): Promise<T> {
  signal.throwIfAborted();
  let onAbort: () => void = () => {};
  const aborted = new Promise<never>((_, reject) => {
    onAbort = () => reject(signal.reason);
    signal.addEventListener('abort', onAbort, { once: true });
  });
  try {
    return await Promise.race([work(), aborted]);
  } finally {
    signal.removeEventListener('abort', onAbort);
  }
}

export function chatStream(
  cancellation: AbortController,
  signal: AbortSignal,
  work: (send: (data: unknown) => void) => Promise<void>,
  errorData: unknown,
): ReadableStream<Uint8Array> {
  let closed = false;
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const close = () => {
        if (!closed) { closed = true; controller.close(); }
      };
      const enqueue = (text: string) => {
        if (!closed && !signal.aborted) controller.enqueue(encoder.encode(text));
      };
      const send = (data: unknown) => enqueue(`data: ${JSON.stringify(data)}\n\n`);
      signal.addEventListener('abort', close, { once: true });
      try {
        await waitForChatWork(signal, () => work(send));
        enqueue('data: [DONE]\n\n');
      } catch (error) {
        if (!signal.aborted) {
          console.error('Chat stream failed:', error);
          send(errorData);
          enqueue('data: [DONE]\n\n');
        }
      } finally {
        signal.removeEventListener('abort', close);
        close();
      }
    },
    cancel() {
      closed = true;
      cancellation.abort();
    },
  });
}
