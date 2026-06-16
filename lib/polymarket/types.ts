export interface PolymarketSnapshot {
  date: string;
  market_id: string;
  question: string;
  slug: string | null;
  outcome_yes: number;
  outcome_no: number;
  volume: number;
  liquidity: number;
  active: boolean;
  source: string;
  raw_data: Record<string, unknown>;
}

export interface GammaMarket {
  id: string;
  question: string;
  slug: string;
  outcomePrices: string;
  outcomes: string;
  volume: string;
  liquidity: string;
  active: boolean;
  closed: boolean;
  end_date_iso: string;
}
