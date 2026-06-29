export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      lesson_progress: {
        Row: {
          id: string;
          user_id: string;
          course_slug: string;
          lesson_slug: string;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_slug: string;
          lesson_slug: string;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_slug?: string;
          lesson_slug?: string;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
      };
      price_alerts: {
        Row: {
          id: string;
          user_id: string;
          target_price: number;
          direction: 'above' | 'below';
          notify_email: boolean;
          notify_push: boolean;
          triggered: boolean;
          triggered_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          target_price: number;
          direction: 'above' | 'below';
          notify_email?: boolean;
          notify_push?: boolean;
          triggered?: boolean;
          triggered_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          target_price?: number;
          direction?: 'above' | 'below';
          notify_email?: boolean;
          notify_push?: boolean;
          triggered?: boolean;
          triggered_at?: string | null;
          created_at?: string;
        };
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          content_type: 'article' | 'lesson';
          content_slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_type: 'article' | 'lesson';
          content_slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content_type?: 'article' | 'lesson';
          content_slug?: string;
          created_at?: string;
        };
      };
      highlights: {
        Row: {
          id: string;
          user_id: string;
          content_type: 'article' | 'lesson';
          content_slug: string;
          text: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_type: 'article' | 'lesson';
          content_slug: string;
          text: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content_type?: 'article' | 'lesson';
          content_slug?: string;
          text?: string;
          note?: string | null;
          created_at?: string;
        };
      };
      etf_snapshots: {
        Row: {
          id: string;
          ticker: string;
          date: string;
          fund_name: string;
          nav_per_share: number;
          shares_outstanding: number;
          total_net_assets: number;
          market_price: number | null;
          volume: number | null;
          premium_discount: number | null;
          source: string;
          raw_data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticker: string;
          date: string;
          fund_name: string;
          nav_per_share: number;
          shares_outstanding: number;
          total_net_assets: number;
          market_price?: number | null;
          volume?: number | null;
          premium_discount?: number | null;
          source: string;
          raw_data?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticker?: string;
          date?: string;
          fund_name?: string;
          nav_per_share?: number;
          shares_outstanding?: number;
          total_net_assets?: number;
          market_price?: number | null;
          volume?: number | null;
          premium_discount?: number | null;
          source?: string;
          raw_data?: Json;
          created_at?: string;
        };
      };
      fedwatch_snapshots: {
        Row: {
          id: string;
          date: string;
          current_rate: number;
          target_lower: number;
          target_upper: number;
          meetings: Json;
          sources: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          current_rate: number;
          target_lower: number;
          target_upper: number;
          meetings: Json;
          sources: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          current_rate?: number;
          target_lower?: number;
          target_upper?: number;
          meetings?: Json;
          sources?: string[];
          created_at?: string;
        };
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          created_at?: string;
        };
      };
      slr_snapshots: {
        Row: {
          id: string;
          date: string;
          leverage_subindex: number | null;
          tier1_leverage_capital: number | null;
          policy_signal: number;
          policy_event: string | null;
          source: string;
          raw_data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          leverage_subindex?: number | null;
          tier1_leverage_capital?: number | null;
          policy_signal?: number;
          policy_event?: string | null;
          source?: string;
          raw_data?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          leverage_subindex?: number | null;
          tier1_leverage_capital?: number | null;
          policy_signal?: number;
          policy_event?: string | null;
          source?: string;
          raw_data?: Json;
          created_at?: string;
        };
      };
      liquidity_snapshots: {
        Row: {
          id: string;
          date: string;
          fed_balance_sheet: number | null;
          tga_balance: number | null;
          reverse_repo: number | null;
          bank_reserves: number | null;
          m2: number | null;
          net_liquidity: number | null;
          sofr: number | null;
          effr: number | null;
          source: string;
          raw_data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          fed_balance_sheet?: number | null;
          tga_balance?: number | null;
          reverse_repo?: number | null;
          bank_reserves?: number | null;
          m2?: number | null;
          net_liquidity?: number | null;
          sofr?: number | null;
          effr?: number | null;
          source?: string;
          raw_data?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          fed_balance_sheet?: number | null;
          tga_balance?: number | null;
          reverse_repo?: number | null;
          bank_reserves?: number | null;
          m2?: number | null;
          net_liquidity?: number | null;
          sofr?: number | null;
          effr?: number | null;
          source?: string;
          raw_data?: Json;
          created_at?: string;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type LessonProgress = Database['public']['Tables']['lesson_progress']['Row'];
export type PriceAlert = Database['public']['Tables']['price_alerts']['Row'];
export type PushSubscription = Database['public']['Tables']['push_subscriptions']['Row'];
export type EtfSnapshot = Database['public']['Tables']['etf_snapshots']['Row'];
export type FedWatchSnapshot = Database['public']['Tables']['fedwatch_snapshots']['Row'];
export type SlrSnapshot = Database['public']['Tables']['slr_snapshots']['Row'];
export type LiquiditySnapshot = Database['public']['Tables']['liquidity_snapshots']['Row'];
