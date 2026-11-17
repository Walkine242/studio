import Stripe from 'stripe';
import { STRIPE_PLANS } from '@/config/stripe-plans';

export type PlanId = 'monthly' | 'annual' | 'lifetime';

/** Plans used by checkout, built from the shared plan list in config/stripe-plans.ts. */
export const PLANS: Record<PlanId, { name: string; description: string; amountCents: number; recurring: 'month' | 'year' | null; stripePriceId?: string }> = {
  monthly: { ...STRIPE_PLANS.monthly, recurring: 'month' },
  annual: { ...STRIPE_PLANS.annual, recurring: 'year' },
  lifetime: { ...STRIPE_PLANS.lifetime, recurring: null },
};

export function getStripeInstance() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not set.');
  return new Stripe(secretKey, {
    // Managed Payments (Stripe as merchant of record) needs 2025-03-31.basil or later.
    apiVersion: '2025-03-31.basil' as any,
    typescript: true,
  });
}

/**
 * Stripe product tax code for Dual Pro: "Software as a service (SaaS) - personal use".
 * Required when Managed Payments is on (Stripe handles sales tax/VAT as merchant of
 * record). Override with STRIPE_TAX_CODE if Stripe suggests a different category.
 */
export const DUAL_TAX_CODE = process.env.STRIPE_TAX_CODE || 'txcd_10103000';
