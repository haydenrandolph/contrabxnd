/** A single daily snapshot of macro liquidity indicators */
export interface LiquiditySnapshot {
  /** Observation date (YYYY-MM-DD) */
  date: string;
  /** Fed balance sheet total assets — WALCL (in millions USD, weekly) */
  fed_balance_sheet: number | null;
  /** Treasury General Account balance — WTREGEN (in millions USD, daily) */
  tga_balance: number | null;
  /** Overnight reverse-repo facility total — RRPONTSYD (in millions USD, daily) */
  reverse_repo: number | null;
  /** Bank reserves at the Fed — WRESBAL (in millions USD, weekly) */
  bank_reserves: number | null;
  /** M2 money supply — M2SL (in millions USD, monthly) */
  m2: number | null;
  /**
   * Net Liquidity = Fed Balance Sheet - TGA - Reverse Repo
   * Only computed when all three components are available.
   * In millions USD.
   */
  net_liquidity: number | null;
  /** Secured Overnight Financing Rate in percent */
  sofr: number | null;
  /** Effective Federal Funds Rate in percent */
  effr: number | null;
  /** Data sources used */
  source: string;
  /** Raw API responses for debugging / audit */
  raw_data: Record<string, unknown>;
}
