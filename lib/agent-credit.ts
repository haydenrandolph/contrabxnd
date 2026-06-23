import crypto from 'crypto';

export interface CreditScore {
  compositeScore: number;
  accuracy: number | null;
  volume: number;
  consistency: number | null;
  calibration: number | null;
  ageDays: number;
  totalPredictions: number;
  correctPredictions: number;
}

interface Prediction {
  confidence: number;
  outcome: 'correct' | 'incorrect' | 'expired' | 'pending';
  submitted_at: string;
  resolved_at: string | null;
}

export function hashPrediction(text: string, agentId: string, timestamp: string): string {
  return crypto
    .createHash('sha256')
    .update(`${agentId}:${timestamp}:${text}`)
    .digest('hex');
}

export function computeCreditScore(predictions: Prediction[], registeredAt: string): CreditScore {
  const resolved = predictions.filter(p => p.outcome === 'correct' || p.outcome === 'incorrect');
  const total = resolved.length;
  const correct = resolved.filter(p => p.outcome === 'correct').length;

  const ageDays = Math.floor((Date.now() - new Date(registeredAt).getTime()) / 86400000);

  if (total < 3) {
    return {
      compositeScore: 0,
      accuracy: null,
      volume: total,
      consistency: null,
      calibration: null,
      ageDays,
      totalPredictions: predictions.length,
      correctPredictions: correct,
    };
  }

  // Accuracy: weighted by recency (recent predictions count more)
  const now = Date.now();
  let weightedCorrect = 0;
  let weightedTotal = 0;
  for (const p of resolved) {
    const age = (now - new Date(p.resolved_at || p.submitted_at).getTime()) / 86400000;
    const weight = Math.exp(-age / 90); // half-life ~90 days
    weightedTotal += weight;
    if (p.outcome === 'correct') weightedCorrect += weight;
  }
  const accuracy = weightedTotal > 0 ? weightedCorrect / weightedTotal : 0;

  // Volume: log scale, caps contribution at ~100 predictions
  const volumeScore = Math.min(1, Math.log10(total + 1) / 2);

  // Consistency: sliding window variance in accuracy
  const windowSize = Math.min(10, Math.floor(total / 2));
  let consistency = 1;
  if (windowSize >= 3) {
    const windows: number[] = [];
    for (let i = 0; i <= resolved.length - windowSize; i++) {
      const window = resolved.slice(i, i + windowSize);
      const winAcc = window.filter(p => p.outcome === 'correct').length / windowSize;
      windows.push(winAcc);
    }
    if (windows.length >= 2) {
      const mean = windows.reduce((a, b) => a + b, 0) / windows.length;
      const variance = windows.reduce((sum, v) => sum + (v - mean) ** 2, 0) / windows.length;
      consistency = Math.max(0, 1 - Math.sqrt(variance) * 2);
    }
  }

  // Calibration: how well confidence matches actual hit rate
  // Group by confidence bucket, compare predicted vs actual
  const buckets = new Map<number, { total: number; correct: number }>();
  for (const p of resolved) {
    const bucket = Math.round(p.confidence * 10) / 10; // round to 0.1
    const b = buckets.get(bucket) || { total: 0, correct: 0 };
    b.total++;
    if (p.outcome === 'correct') b.correct++;
    buckets.set(bucket, b);
  }

  let calibrationError = 0;
  let calibrationWeight = 0;
  for (const [conf, b] of buckets) {
    if (b.total >= 2) {
      const actual = b.correct / b.total;
      calibrationError += Math.abs(conf - actual) * b.total;
      calibrationWeight += b.total;
    }
  }
  const calibration = calibrationWeight > 0
    ? Math.max(0, 1 - (calibrationError / calibrationWeight) * 2)
    : 0.5;

  // Age bonus: ramps up over first 30 days, then flat
  const ageScore = Math.min(1, ageDays / 30);

  // Composite: weighted blend
  const composite = Math.round(
    (accuracy * 40 + volumeScore * 15 + consistency * 20 + calibration * 15 + ageScore * 10) * 100
  ) / 100;

  return {
    compositeScore: Math.min(100, Math.max(0, composite)),
    accuracy: Math.round(accuracy * 1000) / 1000,
    volume: total,
    consistency: Math.round(consistency * 1000) / 1000,
    calibration: Math.round(calibration * 1000) / 1000,
    ageDays,
    totalPredictions: predictions.length,
    correctPredictions: correct,
  };
}
