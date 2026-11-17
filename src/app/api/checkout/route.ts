import { NextResponse } from 'next/server';
import { getStripeInstance, PLANS, DUAL_TAX_CODE, type PlanId } from '@/lib/stripe';
import { getServerUser, getAdminSupabase } from '@/lib/supabase/server';

// Starts a Stripe Checkout session for the signed-in user. Membership is only
// switched on later by the Stripe webhook, once Stripe confirms the payment.
export async function POST(request: Request) {
  try {
    const { user } = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Please log in before upgrading.' }, { status: 401 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payments are not set up yet. Please try again later.' },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const planId: PlanId = body.plan in PLANS ? body.plan : 'annual';
    const plan = PLANS[planId];
    const origin = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'https://dualswim.app';

    const stripe = getStripeInstance();

    // Reuse the Stripe customer if this user has paid before.
    const { data: existing } = await getAdminSupabase()
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    // Swimmers still in their free trial aren't charged until it ends.
    const { data: profile } = await getAdminSupabase()
      .from('profiles')
      .select('trial_ends_at')
      .eq('id', user.id)
      .maybeSingle();
    const trialEnd = profile?.trial_ends_at ? Math.floor(new Date(profile.trial_ends_at).getTime() / 1000) : 0;
    // Stripe requires a trial end at least 48 hours away.
    const keepTrial = plan.recurring && trialEnd > Math.floor(Date.now() / 1000) + 49 * 3600;

    const params: Record<string, any> = {
      mode: plan.recurring ? 'subscription' : 'payment',
      client_reference_id: user.id,
      metadata: { user_id: user.id, plan: planId },
      ...(plan.recurring
        ? { subscription_data: { metadata: { user_id: user.id, plan: planId }, ...(keepTrial ? { trial_end: trialEnd } : {}) } }
        : { payment_intent_data: { metadata: { user_id: user.id, plan: planId } } }),
      ...(existing?.stripe_customer_id
        ? { customer: existing.stripe_customer_id }
        : { customer_email: user.email ?? undefined }),
      line_items: [
        plan.stripePriceId
          ? { price: plan.stripePriceId, quantity: 1 }
          : {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: plan.description,
              tax_code: DUAL_TAX_CODE,
            },
            unit_amount: plan.amountCents,
            ...(plan.recurring ? { recurring: { interval: plan.recurring } } : {}),
          },
          quantity: 1,
        } as any,
      ],
      success_url: `${origin}/dual?payment=success`,
      cancel_url: `${origin}/premium?payment=cancelled`,
    };

    // STRIPE_MANAGED_PAYMENTS=off turns Stripe's merchant-of-record mode off for
    // Dual's checkouts; otherwise the Stripe account's default applies.
    if (process.env.STRIPE_MANAGED_PAYMENTS === 'off') params.managed_payments = { enabled: false };

    let session;
    try {
      session = await stripe.checkout.sessions.create(params as any);
    } catch (err: any) {
      // If Managed Payments rejects this checkout (e.g. a setting it doesn't
      // support), retry once as a standard Stripe checkout so customers can still pay.
      if (err?.type !== 'StripeInvalidRequestError' || !/managed.?payments/i.test(String(err?.message)) || params.managed_payments) throw err;
      console.warn('Managed Payments rejected checkout; retrying without it:', err.message);
      session = await stripe.checkout.sessions.create({ ...params, managed_payments: { enabled: false } } as any);
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout API Error:', error);
    return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 500 });
  }
}
