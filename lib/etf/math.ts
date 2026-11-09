export function isFreshDate(date: unknown, maxDays: number, now = Date.now()): date is string {
  if (typeof date !== 'string') return false;
  const time = Date.parse(date);
  const age = now - time;
  return Number.isFinite(time) && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(time).toISOString().slice(0, 10) === date) &&
    age >= 0 && age <= maxDays * 86_400_000;
}

export function normalizeIssuerDate(value: unknown, now = Date.now()): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return null;
  const date = new Date(time).toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}/.test(value) && value.slice(0, 10) !== date) return null;
  return isFreshDate(date, 7, now) ? date : null;
}

export function etfFlowDollars(
  current: { nav_per_share: number; shares_outstanding: number; total_net_assets: number },
  previous: { nav_per_share: number; shares_outstanding: number; total_net_assets: number },
): number | null {
  if (![current.nav_per_share, previous.nav_per_share, current.shares_outstanding, previous.shares_outstanding,
    current.total_net_assets, previous.total_net_assets]
    .every(v => typeof v === 'number' && Number.isFinite(v) && v > 0)) return null;
  const flow = (current.shares_outstanding - previous.shares_outstanding) * current.nav_per_share;
  return Number.isFinite(flow) ? flow : null;
}

export function scoreEtfFlow(dollars: number): number {
  return Math.max(-100, Math.min(100, Math.round(dollars / 5_000_000)));
}
