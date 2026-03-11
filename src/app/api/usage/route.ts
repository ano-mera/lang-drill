import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const FREE_DAILY_LIMIT = 5;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if pro user
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single();

  if (profile?.subscription_status === 'pro') {
    return NextResponse.json({ remaining: -1, limit: -1, used: 0 });
  }

  const today = new Date().toISOString().split('T')[0];
  const { data: usage } = await supabase
    .from('daily_usage')
    .select('question_count')
    .eq('user_id', user.id)
    .eq('usage_date', today)
    .single();

  const used = usage?.question_count ?? 0;
  return NextResponse.json({
    remaining: Math.max(0, FREE_DAILY_LIMIT - used),
    limit: FREE_DAILY_LIMIT,
    used,
  });
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if pro user
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single();

  if (profile?.subscription_status === 'pro') {
    return NextResponse.json({ canProceed: true, remaining: -1 });
  }

  const today = new Date().toISOString().split('T')[0];

  // Upsert daily usage
  const { data: usage } = await supabase
    .from('daily_usage')
    .select('question_count')
    .eq('user_id', user.id)
    .eq('usage_date', today)
    .single();

  const currentCount = usage?.question_count ?? 0;

  if (currentCount >= FREE_DAILY_LIMIT) {
    return NextResponse.json({
      canProceed: false,
      remaining: 0,
      limit: FREE_DAILY_LIMIT,
    });
  }

  // Increment usage
  await supabase.from('daily_usage').upsert(
    {
      user_id: user.id,
      usage_date: today,
      question_count: currentCount + 1,
    },
    { onConflict: 'user_id,usage_date' }
  );

  const remaining = FREE_DAILY_LIMIT - currentCount - 1;
  return NextResponse.json({
    canProceed: true,
    remaining: Math.max(0, remaining),
    limit: FREE_DAILY_LIMIT,
  });
}
