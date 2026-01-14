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
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type LessonProgress = Database['public']['Tables']['lesson_progress']['Row'];
export type PriceAlert = Database['public']['Tables']['price_alerts']['Row'];
export type PushSubscription = Database['public']['Tables']['push_subscriptions']['Row'];
