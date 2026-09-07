import Stripe from 'stripe';

export function getStripeInstance() {
  const secretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key_for_build';
  return new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia' as any,
    typescript: true,
  });
}
