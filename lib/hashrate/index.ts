/**
 * Hash Rate & Difficulty intelligence.
 *
 * Computes the Hash Ribbon (30d vs 60d hashrate MA — the classic miner
 * capitulation / recovery bottom signal), the Difficulty Ribbon (difficulty
 * moving averages + compression), and the next difficulty-adjustment forecast.
 *
 * Source selection: prefers the Contrabxnd node, but the node's mempool.space
 * mining indexer runs as a SEPARATE background pass after block sync — until it
 * finishes, the mining endpoints return zeroed hashrate history and a bogus
 * difficulty-adjustment. We validate the node's response and transparently fall
 * back to public mempool.space for just these derived stats when it's not ready.
 * Block/tx/address queries remain fully sovereign.
 */
import { nodeFetch } from '@/lib/node/client';

const PUBLIC = 'https://mempool.space';

export type MiningSource = 'node' | 'public';

interface HashPoint { timestamp: number; avgHashrate: number }
interface DiffEpoch { time: number; height: number; difficulty: number; adjustment: number }
interface HashrateResponse {
  hashrates: HashPoint[];
  difficulty: DiffEpoch[];
  currentHashrate: number;
  currentDifficulty: number;
}
interface DiffAdjResponse {
  progressPercent: number;
  difficultyChange: number;
  remainingBlocks: number;
  estimatedRetargetDate: number;
  nextRetargetHeight: number;
  timeAvg: number;
}

export type HashRibbonState = 'recovery' | 'expansion' | 'neutral' | 'capitulation';

export interface MiningIntelligence {
  current_hashrate_ehs: number;
  current_difficulty: number;
  difficulty_adjustment: {
    progress_percent: number;
    estimated_change_percent: number;
    remaining_blocks: number;
    estimated_retarget_date: string;
    days_until: number;
    avg_block_time_min: number;
  };
  hash_ribbon: {
    ma30_ehs: number;
    ma60_ehs: number;
    ratio: number;
    state: HashRibbonState;
    recovery_signal: boolean;
  };
  difficulty_ribbon: {
    compression: boolean;
    mas: Record<string, number>; // ma9..ma200 (difficulty)
  };
  score: number; // -100..+100 for the Contrabxnd Score
  detail: string;
  source: MiningSource;
  timestamp: string;
}

const EH = 1e18;

function clamp(v: number): number {
  return Math.max(-100, Math.min(100, Math.round(v)));
}

/** Trailing simple moving average ending at index `end` (inclusive). */
function sma(values: number[], period: number, end: number): number | null {
  if (end + 1 < period) return null;
  let s = 0;
  for (let i = end - period + 1; i <= end; i++) s += values[i];
  return s / period;
}

async function fetchValidated<T>(
  path: string,
  isValid: (d: T) => boolean,
): Promise<{ data: T; source: MiningSource }> {
  // Try the node first; accept only if the payload passes validation.
  try {
    const { res } = await nodeFetch(path);
    if (res.ok) {
      const data = (await res.json()) as T;
      if (isValid(data)) return { data, source: 'node' };
    }
  } catch {
    /* fall through to public */
  }
  // Public mempool.space — correct, complete mining history.
  const r = await fetch(`${PUBLIC}${path}`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`mining fetch ${path}: ${r.status}`);
  return { data: (await r.json()) as T, source: 'public' };
}

function validHashrate(d: HashrateResponse): boolean {
  if (!d?.hashrates?.length) return false;
  const nonZero = d.hashrates.filter((h) => h.avgHashrate > 0).length;
  return nonZero >= 60; // need at least 60 valid days for the 60d MA
}

function validDiffAdj(d: DiffAdjResponse): boolean {
  if (!d) return false;
  // ~5–30 min/block and a sane retarget magnitude rule out a stale mining index.
  return (
    d.timeAvg > 300_000 &&
    d.timeAvg < 1_800_000 &&
    d.difficultyChange > -25 &&
    d.difficultyChange < 25 &&
    d.remainingBlocks >= 0 &&
    d.remainingBlocks <= 2016
  );
}

/** Build a daily difficulty series aligned to the hashrate day timestamps. */
function dailyDifficulty(epochs: DiffEpoch[], days: HashPoint[]): number[] {
  const sorted = [...epochs].sort((a, b) => a.time - b.time);
  if (!sorted.length) return [];
  return days.map((d) => {
    let val = sorted[0].difficulty;
    for (const e of sorted) {
      if (e.time <= d.timestamp) val = e.difficulty;
      else break;
    }
    return val;
  });
}

function ribbonState(ma30: number, ma60: number, hist30: number[], hist60: number[]): { state: HashRibbonState; recovery: boolean } {
  const ratio = ma30 / ma60;
  // Recovery = ma30 climbed back above ma60 after recently being below it.
  const wasBelow = hist30.some((v, i) => hist60[i] != null && v < hist60[i]);
  if (ma30 >= ma60 && wasBelow) return { state: 'recovery', recovery: true };
  if (ratio > 1.015) return { state: 'expansion', recovery: false };
  if (ratio < 0.985) return { state: 'capitulation', recovery: false };
  return { state: 'neutral', recovery: false };
}

export async function getMiningIntelligence(): Promise<MiningIntelligence> {
  const [hr, da] = await Promise.all([
    fetchValidated<HashrateResponse>('/api/v1/mining/hashrate/1y', validHashrate),
    fetchValidated<DiffAdjResponse>('/api/v1/difficulty-adjustment', validDiffAdj),
  ]);

  const series = hr.data.hashrates.filter((h) => h.avgHashrate > 0);
  const values = series.map((h) => h.avgHashrate);
  const last = values.length - 1;

  const ma30 = sma(values, 30, last) ?? hr.data.currentHashrate;
  const ma60 = sma(values, 60, last) ?? hr.data.currentHashrate;

  // Last ~21 days of ma30/ma60 to detect a recovery cross.
  const hist30: number[] = [];
  const hist60: number[] = [];
  for (let i = Math.max(0, last - 21); i <= last; i++) {
    const m30 = sma(values, 30, i);
    const m60 = sma(values, 60, i);
    if (m30 != null && m60 != null) { hist30.push(m30); hist60.push(m60); }
  }
  const { state, recovery } = ribbonState(ma30, ma60, hist30, hist60);
  const ratio = ma30 / ma60;

  // Difficulty ribbon (MAs of daily-resampled difficulty) + compression flag.
  const diffSeries = dailyDifficulty(hr.data.difficulty, series);
  const dl = diffSeries.length - 1;
  const periods = [9, 14, 25, 40, 60, 90, 128, 200];
  const mas: Record<string, number> = {};
  for (const p of periods) {
    const v = sma(diffSeries, p, dl);
    if (v != null) mas[`ma${p}`] = v;
  }
  // Compression: short-term difficulty MA dipping below the long-term = miners
  // turning off (the historical bottom zone).
  const compression = mas.ma9 != null && mas.ma60 != null ? mas.ma9 < mas.ma60 : false;

  // Score: hash ribbon drives it. Recovery is the strong buy; expansion healthy;
  // capitulation = bearish momentum (but where bottoms form).
  let score: number;
  if (recovery) score = 80;
  else if (state === 'expansion') score = clamp((ratio - 1) * 2000); // +30 at +1.5%
  else if (state === 'capitulation') score = clamp((ratio - 1) * 2000); // negative
  else score = 0;

  const da_ = da.data;
  const retargetMs = da_.estimatedRetargetDate;
  const daysUntil = Math.max(0, (retargetMs - Date.now()) / 86_400_000);

  const stateLabel = state.charAt(0).toUpperCase() + state.slice(1);
  const detail = `Hash ribbon: ${stateLabel} (30d MA ${(ratio >= 1 ? '+' : '')}${((ratio - 1) * 100).toFixed(1)}% vs 60d). Next difficulty ${da_.difficultyChange >= 0 ? '+' : ''}${da_.difficultyChange.toFixed(1)}% in ~${Math.round(daysUntil)}d.`;

  return {
    current_hashrate_ehs: +(hr.data.currentHashrate / EH).toFixed(1),
    current_difficulty: hr.data.currentDifficulty,
    difficulty_adjustment: {
      progress_percent: +da_.progressPercent.toFixed(1),
      estimated_change_percent: +da_.difficultyChange.toFixed(2),
      remaining_blocks: da_.remainingBlocks,
      estimated_retarget_date: new Date(retargetMs).toISOString(),
      days_until: +daysUntil.toFixed(1),
      avg_block_time_min: +(da_.timeAvg / 60_000).toFixed(1),
    },
    hash_ribbon: {
      ma30_ehs: +(ma30 / EH).toFixed(1),
      ma60_ehs: +(ma60 / EH).toFixed(1),
      ratio: +ratio.toFixed(4),
      state,
      recovery_signal: recovery,
    },
    difficulty_ribbon: { compression, mas },
    score,
    detail,
    // If either stat came from public, the derived view is mixed; report the
    // weaker of the two so the UI can show an honest source badge.
    source: hr.source === 'node' && da.source === 'node' ? 'node' : 'public',
    timestamp: new Date().toISOString(),
  };
}
