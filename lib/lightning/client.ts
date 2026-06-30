/**
 * Lightning (LND REST) client for the Contrabxnd node.
 *
 * Talks to LND's REST API over the Cloudflare Tunnel (e.g. https://lnd.cbx-node.com).
 * Auth is a hex-encoded macaroon sent in the `Grpc-Metadata-macaroon` header.
 *
 * SECURITY: the macaroon stored in env MUST be a read + invoice-only macaroon
 * (no `offchain`/`onchain` write/send permissions). This pass only reads node
 * state and creates receive invoices — it cannot move funds. Bake it with:
 *   lncli bakemacaroon \
 *     info:read offchain:read onchain:read invoices:read invoices:write \
 *     --save_to cbx.macaroon
 *   xxd -ps -c 1000 cbx.macaroon   # hex for LND_MACAROON_HEX
 *
 * Env:
 *   LND_REST_URL       base URL of the tunneled LND REST API (no trailing path)
 *   LND_MACAROON_HEX   hex-encoded read+invoice macaroon
 */

const LND_URL = process.env.LND_REST_URL?.replace(/\/+$/, '');
const MACAROON = process.env.LND_MACAROON_HEX;
const TIMEOUT_MS = 8000;

export function lndConfigured(): boolean {
  return !!LND_URL && !!MACAROON;
}

class LndError extends Error {}

async function lndFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!LND_URL || !MACAROON) throw new LndError('Lightning node not configured');
  const res = await fetch(`${LND_URL}${path}`, {
    ...init,
    headers: {
      'Grpc-Metadata-macaroon': MACAROON,
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new LndError(`LND ${path} failed: ${res.status} ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

const lndGet = <T>(path: string) => lndFetch<T>(path);
const lndPost = <T>(path: string, body: unknown) =>
  lndFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });

// ── LND REST response shapes (subset) ──
export interface LndInfo {
  identity_pubkey: string;
  alias: string;
  num_active_channels: number;
  num_peers: number;
  block_height: number;
  synced_to_chain: boolean;
  version: string;
  uris?: string[];
}
interface ChannelBalance {
  local_balance?: { sat: string };
  remote_balance?: { sat: string };
  balance: string;
  pending_open_balance: string;
}
interface ChainBalance {
  total_balance: string;
  confirmed_balance: string;
  unconfirmed_balance: string;
}
export interface LndChannel {
  active: boolean;
  remote_pubkey: string;
  channel_point: string;
  capacity: string;
  local_balance: string;
  remote_balance: string;
}
interface AddInvoiceResp {
  r_hash: string;
  payment_request: string;
  add_index: string;
}
export interface DecodedInvoice {
  destination: string;
  num_satoshis: string;
  timestamp: string;
  expiry: string;
  description: string;
  payment_hash: string;
}

export const getInfo = () => lndGet<LndInfo>('/v1/getinfo');

export async function getBalances() {
  const [chan, chain] = await Promise.all([
    lndGet<ChannelBalance>('/v1/balance/channels'),
    lndGet<ChainBalance>('/v1/balance/blockchain'),
  ]);
  return {
    channel_local_sat: Number(chan.local_balance?.sat ?? chan.balance ?? 0),
    channel_remote_sat: Number(chan.remote_balance?.sat ?? 0),
    channel_pending_open_sat: Number(chan.pending_open_balance ?? 0),
    onchain_confirmed_sat: Number(chain.confirmed_balance ?? 0),
    onchain_unconfirmed_sat: Number(chain.unconfirmed_balance ?? 0),
  };
}

export async function listChannels() {
  const { channels } = await lndGet<{ channels: LndChannel[] }>('/v1/channels');
  return (channels ?? []).map((c) => ({
    active: c.active,
    remote_pubkey: c.remote_pubkey,
    channel_point: c.channel_point,
    capacity_sat: Number(c.capacity),
    local_balance_sat: Number(c.local_balance),
    remote_balance_sat: Number(c.remote_balance),
  }));
}

export async function createInvoice(value_sat: number, memo?: string) {
  const resp = await lndPost<AddInvoiceResp>('/v1/invoices', { value: String(value_sat), memo: memo ?? '' });
  return { payment_request: resp.payment_request, add_index: resp.add_index };
}

export const decodeInvoice = (payreq: string) =>
  lndGet<DecodedInvoice>(`/v1/payreq/${encodeURIComponent(payreq)}`);
