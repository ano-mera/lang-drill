import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';

async function updateProfile(supabase: ReturnType<typeof createAdminClient>, userId: string, data: Record<string, unknown>) {
  await supabase.from('profiles').update({
    ...data,
    updated_at: new Date().toISOString(),
  }).eq('id', userId);
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createAdminClient();
  // Webhook event objects vary by event type - use loose typing for property access
  const obj = event.data.object as unknown as Record<string, any>; // eslint-disable-line

  switch (event.type) {
    case 'checkout.session.completed': {
      const subscriptionId = typeof obj.subscription === 'string'
        ? obj.subscription : obj.subscription?.id;

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata.supabase_user_id;
        if (userId) {
          const periodEnd = subscription.items.data[0]?.current_period_end;
          await updateProfile(supabase, userId, {
            subscription_status: 'pro',
            subscription_id: subscription.id,
            stripe_customer_id: typeof obj.customer === 'string'
              ? obj.customer : obj.customer?.id,
            current_period_end: periodEnd
              ? new Date(periodEnd * 1000).toISOString()
              : new Date().toISOString(),
            cancel_at: null,
          });
        }
      }
      break;
    }

    case 'invoice.paid': {
      const subscriptionId = typeof obj.subscription === 'string'
        ? obj.subscription : obj.subscription?.id;

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata.supabase_user_id;
        if (userId) {
          const periodEnd = subscription.items.data[0]?.current_period_end;
          await updateProfile(supabase, userId, {
            subscription_status: 'pro',
            current_period_end: periodEnd
              ? new Date(periodEnd * 1000).toISOString()
              : new Date().toISOString(),
          });
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const userId = obj.metadata?.supabase_user_id;
      if (userId) {
        await updateProfile(supabase, userId, {
          subscription_status: 'canceled',
        });
      }
      break;
    }

    case 'customer.subscription.updated': {
      const userId = obj.metadata?.supabase_user_id;
      if (userId) {
        const status = obj.status === 'active' ? 'pro'
          : obj.status === 'past_due' ? 'past_due'
          : obj.status === 'canceled' ? 'canceled'
          : 'free';
        const periodEnd = obj.items?.data?.[0]?.current_period_end;
        const cancelAt = obj.cancel_at
          ? new Date(obj.cancel_at * 1000).toISOString()
          : null;
        await updateProfile(supabase, userId, {
          subscription_status: status,
          current_period_end: periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : new Date().toISOString(),
          cancel_at: cancelAt,
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
