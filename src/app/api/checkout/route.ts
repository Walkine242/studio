import { NextResponse } from 'next/server';
import { getStripeInstance } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin') || 'https://dualswim.app';
    const body = await request.json().catch(() => ({}));
    const plan = body.plan || 'annual';
    const amount = plan === 'lifetime' ? 9900 : plan === 'monthly' ? 399 : 2000;
    const planName = plan === 'lifetime' ? 'Dual Lifetime Founder Pass' : plan === 'monthly' ? 'Dual Monthly Pass' : 'Dual Annual Membership';

    if (!process.env.STRIPE_SECRET_KEY) {
      // Graceful fallback for test/dev mode before live keys are added to Vercel env
      return NextResponse.json({
        url: `${origin}/dual?payment=success&mock=true`,
        simulated: true,
      });
    }

    const stripe = getStripeInstance();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planName,
              description: 'Access to public swim meets, AI workout generator, head-to-head dual battles, and global leaderboards.',
            },
            unit_amount: amount,
            recurring: plan === 'lifetime' ? undefined : {
              interval: plan === 'monthly' ? 'month' : 'year',
            },
          },
          quantity: 1,
        },
      ],
      mode: plan === 'lifetime' ? 'payment' : 'subscription',
      success_url: `${origin}/dual?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dual?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
