export function parseMacroNumber(value: unknown): number | null {
  if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '' || value === '.') return null;
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

/** All monetary snapshot fields are millions USD; FRED M2SL is billions. */
export function fredMillions(series: string, value: number | null): number | null {
  return value === null ? null : value * (series === 'M2SL' ? 1000 : 1);
}

export function netLiquidity(walcl: number | null, tga: number | null, rrp: number | null): number | null {
  if (walcl === null || tga === null || rrp === null ||
      ![walcl, tga, rrp].every(v => Number.isFinite(v) && v >= 0) || walcl === 0) return null;
  return Math.round((walcl - tga - rrp) * 100) / 100;
}

export function liquidityInputsFresh(raw: Record<string, unknown> | null, now = Date.now()): boolean {
  const tga = raw?.tga as { record_date?: string } | undefined;
  const rrp = raw?.rrp as { operationDate?: string } | undefined;
  return isFreshDate(raw?.walcl_date, 14, now) && isFreshDate(tga?.record_date, 5, now) &&
    isFreshDate(rrp?.operationDate, 5, now);
}
import { isFreshDate } from '../etf/math';
