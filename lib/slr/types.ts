/** A single Fed RSS entry relevant to SLR policy */
export interface FedPolicyEntry {
  /** Title of the press release */
  title: string;
  /** URL link to the press release */
  link: string;
  /** Short description / summary */
  description: string;
  /** Publication date string from the RSS feed */
  pubDate: string;
}

/** Full SLR snapshot for storage */
export interface SlrSnapshot {
  /** Observation date (YYYY-MM-DD) */
  date: string;
  /** NFCI Leverage Subindex value (negative = loose, positive = tight) */
  leverage_subindex: number | null;
  /** Tier 1 Leverage Capital, all FDIC-insured institutions (quarterly) */
  tier1_leverage_capital: number | null;
  /** Policy signal: +1 easing, -1 tightening, 0 neutral */
  policy_signal: number;
  /** Description of the most recent relevant policy event, if any */
  policy_event: string | null;
  /** Data source identifier */
  source: string;
  /** Raw API/RSS data for debugging */
  raw_data: Record<string, unknown>;
}
