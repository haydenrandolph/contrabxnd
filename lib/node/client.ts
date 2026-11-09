/**
 * Contrabxnd node data layer.
 *
 * Talks to FML's self-hosted mempool.space REST API (running on the Umbrel
 * Bitcoin node) when configured, and transparently falls back to the public
 * mempool.space API when the node is unreachable or not yet configured.
 *
 * The self-hosted mempool.space API exposes the SAME paths as the public one
 * (e.g. `/api/v1/blocks`, `/api/mempool`), so callers pass a path and we route
 * it to whichever upstream is healthy. This lets the whole site cut over to the
 * sovereign node by setting one env var, with zero downtime if the node drops.
 *
 * Env:
 *   NODE_MEMPOOL_URL          base URL of the tunneled self-hosted mempool API
 *                             (e.g. https://mempool.contrabxnd.io). No path.
 *   CF_ACCESS_CLIENT_ID       Cloudflare Access service-token id (optional)
 *   CF_ACCESS_CLIENT_SECRET   Cloudflare Access service-token secret (optional)
 *   NODE_PUBLIC_FALLBACK      set false to prohibit public API requests
 */

const NODE_URL = process.env.NODE_MEMPOOL_URL?.replace(/\/+$/, '');
const PUBLIC_URL = 'https://mempool.space';
const CF_ID = process.env.CF_ACCESS_CLIENT_ID;
const CF_SECRET = process.env.CF_ACCESS_CLIENT_SECRET;
const TIMEOUT_MS = 8000;
const PUBLIC_FALLBACK = process.env.NODE_PUBLIC_FALLBACK !== 'false';

export type NodeSource = 'node' | 'public';

function accessHeaders(): Record<string, string> {
  if (CF_ID && CF_SECRET) {
    return { 'CF-Access-Client-Id': CF_ID, 'CF-Access-Client-Secret': CF_SECRET };
  }
  return {};
}

/** True when a sovereign node base URL is configured. */
export function nodeConfigured(): boolean {
  return !!NODE_URL;
}

/**
 * Fetch a mempool-API path, node-first with public fallback.
 * `path` must start with `/api/...` (the shared mempool.space path shape).
 * Returns the raw Response plus which upstream served it.
 */
export async function nodeFetch(
  path: string,
  init?: RequestInit,
): Promise<{ res: Response; source: NodeSource }> {
  init?.signal?.throwIfAborted();
  if (NODE_URL) {
    try {
      const res = await fetch(`${NODE_URL}${path}`, {
        ...init,
        headers: { ...accessHeaders(), ...(init?.headers as Record<string, string> | undefined) },
        cache: 'no-store',
        signal: init?.signal
          ? AbortSignal.any([init.signal, AbortSignal.timeout(TIMEOUT_MS)])
          : AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.ok) return { res, source: 'node' };
      if (!PUBLIC_FALLBACK) return { res, source: 'node' };
    } catch (error) {
      if (!PUBLIC_FALLBACK || init?.signal?.aborted) throw error;
      /* node unreachable — fall through to public */
    }
  }

  if (!PUBLIC_FALLBACK) throw new Error('Public node fallback disabled and no node configured');
  init?.signal?.throwIfAborted();
  const res = await fetch(`${PUBLIC_URL}${path}`, {
    ...init,
    cache: 'no-store',
    signal: init?.signal
      ? AbortSignal.any([init.signal, AbortSignal.timeout(TIMEOUT_MS)])
      : AbortSignal.timeout(TIMEOUT_MS),
  });
  return { res, source: 'public' };
}

/** Fetch + parse JSON, node-first with public fallback. Throws on non-OK. */
export async function nodeJson<T = unknown>(
  path: string,
): Promise<{ data: T; source: NodeSource }> {
  const { res, source } = await nodeFetch(path);
  if (!res.ok) throw new Error(`node fetch ${path} failed: ${res.status}`);
  return { data: (await res.json()) as T, source };
}
