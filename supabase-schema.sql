-- Supabase Schema for LangDrill
-- Run this in Supabase SQL Editor after creating your project

-- ユーザープロフィール（auth.usersの拡張）
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  stripe_customer_id TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'free'
    CHECK (subscription_status IN ('free', 'pro', 'canceled', 'past_due')),
  subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 無料枠の日次利用追跡
CREATE TABLE public.daily_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  usage_date DATE DEFAULT CURRENT_DATE,
  question_count INTEGER DEFAULT 0,
  UNIQUE(user_id, usage_date)
);

-- Data APIアクセス権限の付与（2026/10/30以降の新規テーブルには明示的GRANTが必要）
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_usage TO service_role;

-- 2026/5/30以前に作成された既存プロジェクトではanonにデフォルトでGRANTされているため明示的に剥奪
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.daily_usage FROM anon;

-- RLS有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

-- profiles: ユーザーは自分のプロフィールのみ読み取り可能
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- daily_usage: ユーザーは自分の利用データのみアクセス可能
CREATE POLICY "Users can view own usage"
  ON public.daily_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON public.daily_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON public.daily_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- サインアップ時にprofilesを自動作成するトリガー
-- SET search_path: SECURITY DEFINER関数のsearch_path乗っ取り攻撃を防ぐため固定
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- handle_new_userはトリガー専用のためRPC経由の実行権限を剥奪
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
