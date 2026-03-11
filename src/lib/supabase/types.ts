export type SubscriptionStatus = 'free' | 'pro' | 'canceled' | 'past_due';

export interface Profile {
  id: string;
  email: string | null;
  stripe_customer_id: string | null;
  subscription_status: SubscriptionStatus;
  subscription_id: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyUsage {
  id: string;
  user_id: string;
  usage_date: string;
  question_count: number;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      daily_usage: {
        Row: DailyUsage;
        Insert: Partial<DailyUsage> & { user_id: string };
        Update: Partial<DailyUsage>;
      };
    };
  };
};
