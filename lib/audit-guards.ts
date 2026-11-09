import { timingSafeEqual } from 'node:crypto';

export function cronGuard(request: Request): Response | null {
  const secret = process.env.CRON_SECRET;
  if (!secret?.trim()) return Response.json({ error: 'Cron authentication not configured' }, { status: 503 });
  const actual = Buffer.from(request.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${secret}`);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export function isOperator(userId: string): boolean {
  return (process.env.OPERATOR_USER_IDS || '').split(',').map(id => id.trim()).filter(Boolean).includes(userId);
}

export const MAX_HISTORY_SECONDS = 20 * 366 * 86400;

export function validHistoryRange(from: number, to: number, now = Math.floor(Date.now() / 1000)): boolean {
  return Number.isSafeInteger(from) && Number.isSafeInteger(to) &&
    from >= 1230940800 && from < to && to <= now && to - from <= MAX_HISTORY_SECONDS;
}

export function historyRangeFromDates(start: string, end: string, now = Math.floor(Date.now() / 1000)): { from: number; to: number } | null {
  const dates = [start, end];
  if (dates.some(date => !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) return null;
  const from = Date.parse(start) / 1000;
  const endStart = Date.parse(end) / 1000;
  const to = Math.min(endStart + 86399, now);
  if (from > endStart || endStart > now || !validHistoryRange(from, to, now)) return null;
  return { from, to };
}

export function validPredictionTarget(value: unknown, now = Date.now()): value is string {
  if (typeof value !== 'string' || value.length > 40 || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?$/.test(value)) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value.slice(0, 10) && time > now;
}

export function validNearbyLocation(lat: number, lon: number, radius: number): boolean {
  return Number.isFinite(lat) && Math.abs(lat) <= 90 && Number.isFinite(lon) && Math.abs(lon) <= 180 &&
    Number.isFinite(radius) && radius > 0 && radius <= 20_000;
}
