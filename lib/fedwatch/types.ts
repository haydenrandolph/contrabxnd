/** FOMC meeting with its date and the ZQ contract months needed for calculation */
export interface FomcMeeting {
  /** FOMC decision date (YYYY-MM-DD) */
  date: string;
  /** Calendar month the meeting falls in (YYYY-MM) */
  month: string;
}

/** A single rate-target probability for one FOMC meeting */
export interface RateProbability {
  /** Target range lower bound in bps, e.g. 400 = 4.00% */
  lower_bps: number;
  /** Target range upper bound in bps, e.g. 425 = 4.25% */
  upper_bps: number;
  /** Human-readable label, e.g. "400-425" */
  label: string;
  /** Probability as a decimal 0-1 */
  probability: number;
}

/** Probability snapshot for a single FOMC meeting */
export interface MeetingForecast {
  /** FOMC meeting date (YYYY-MM-DD) */
  meeting_date: string;
  /** Current target rate lower bound in bps */
  current_rate_bps: number;
  /** Current target rate upper bound in bps */
  current_rate_upper_bps: number;
  /** Array of rate-target probabilities (sums to ~1.0) */
  probabilities: RateProbability[];
  /** Implied rate from futures, in percent */
  implied_rate: number;
  /** Probability of at least one cut (sum of all below-current outcomes) */
  cut_probability: number;
  /** Probability of no change */
  hold_probability: number;
  /** Probability of at least one hike (sum of all above-current outcomes) */
  hike_probability: number;
}

/** Full FedWatch snapshot for storage */
export interface FedWatchSnapshot {
  /** Observation date (YYYY-MM-DD) */
  date: string;
  /** Current effective fed funds rate midpoint in percent */
  current_rate: number;
  /** Current target range lower in percent */
  target_lower: number;
  /** Current target range upper in percent */
  target_upper: number;
  /** Per-meeting forecasts */
  meetings: MeetingForecast[];
  /** Data sources used */
  sources: string[];
}
