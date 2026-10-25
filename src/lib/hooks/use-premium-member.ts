'use client';
import { useAuth } from '@/lib/auth/auth-provider';

/**
 * Premium status comes from the database (written by the Stripe webhook),
 * so it can't be switched on from the browser.
 */
export function usePremiumMember() {
  const { isPremium, isLoading, refreshPremium, profile } = useAuth();
  return {
    isPremium,
    isAdmin: profile?.isAdmin ?? false,
    isInitialized: !isLoading,
    refreshPremium,
  };
}
