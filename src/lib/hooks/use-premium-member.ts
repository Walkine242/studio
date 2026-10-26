'use client';
import { useAuth } from '@/lib/auth/auth-provider';

/**
 * Premium status comes from the database: a free trial for new swimmers, or a
 * paid plan written by the Stripe webhook. It can't be switched on from the browser.
 */
export function usePremiumMember() {
  const { isPremium, isLoading, refreshPremium, profile, membership } = useAuth();
  const trialDaysLeft = membership?.onTrial && membership.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(membership.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;
  return {
    isPremium,
    onTrial: membership?.onTrial ?? false,
    trialDaysLeft,
    trialEndsAt: membership?.trialEndsAt ?? null,
    plan: membership?.plan ?? null,
    isAdmin: profile?.isAdmin ?? false,
    isInitialized: !isLoading,
    refreshPremium,
  };
}
