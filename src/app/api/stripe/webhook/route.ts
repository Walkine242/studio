import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripeInstance, type PlanId } from '@/lib/stripe';
import { getAdminSupabase } from '@/lib/supabase/server';

// Stripe calls this after payments and subscription changes. It is the only
// place membership status is written. Configure it in the Stripe dashboard
// (Developers → Webhooks) with these events:
//   checkout.session.completed
//   customer.subscription.created / updated / deleted
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 500 });
  }

  const stripe = getStripeInstance();
  const signature = request.headers.get('stripe-signature');
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature ?? '', secret);
  } catch (error: any) {
    console.error('Stripe webhook signature check failed:', error?.message);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  const db = getAdminSupabase();

  const saveSubscription = async (sub: Stripe.Subscription, fallbackUserId?: string) => {
    const userId = (sub.metadata?.user_id as string | undefined) || fallbackUserId;
    if (!userId) {
      console.error('Subscription without user_id metadata:', sub.id);
      return;
    }
    const plan = ((sub.metadata?.plan as PlanId | undefined) ?? 'annual') as PlanId;
    const periodEnd = (sub as any).current_period_end ?? sub.items?.data?.[0]?.current_period_end;

    // Never downgrade someone who also owns a lifetime pass.
    const { data: current } = await db.from('subscriptions').select('status').eq('user_id', userId).maybeSingle();
    if (current?.status === 'lifetime') return;

    const { error } = await db.from('subscriptions').upsert({
      user_id: userId,
      plan,
      status: sub.status,
      stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
      stripe_subscription_id: sub.id,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  };

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || (session.metadata?.user_id as string | undefined);
        if (!userId) break;

        if (session.mode === 'payment' && session.payment_status === 'paid') {
          const { error } = await db.from('subscriptions').upsert({
            user_id: userId,
            plan: 'lifetime',
            status: 'lifetime',
            stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
            stripe_subscription_id: null,
            current_period_end: null,
            updated_at: new Date().toISOString(),
          });
          if (error) throw error;
        } else if (session.mode === 'subscription' && session.subscription) {
          const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await saveSubscription(sub, userId);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await saveSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error('Stripe webhook handling failed:', error);
    // 500 makes Stripe retry later.
    return NextResponse.json({ error: 'Webhook handling failed.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
