export interface EtfSnapshot {
  ticker: string;
  fund_name: string;
  date: string;
  nav_per_share: number;
  shares_outstanding: number;
  total_net_assets: number;
  market_price: number | null;
  volume: number | null;
  premium_discount: number | null;
  source: string;
  raw_data: Record<string, unknown>;
}

export interface EtfFlow {
  ticker: string;
  name: string;
  flow: number | null;
}

export interface EtfFlowResponse {
  source: string;
  date: string | null;
  funds: EtfFlow[];
  netFlow: number | null;
}
