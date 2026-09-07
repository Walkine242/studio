'use client';
import { useState, useEffect } from 'react';
import { getUserId } from './use-user-profile';
import { getCurrentAccount } from '@/components/auth/auth-modal';

const OWNER_USER_ID = 'user_8r09vt3';
const PREMIUM_STORAGE_KEY = 'dual-is-premium';

export function usePremiumMember() {
  const [isPremium, setIsPremium] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const checkStatus = () => {
    if (typeof window !== 'undefined') {
      const currentUserId = getUserId();
      const account = getCurrentAccount();
      const stored = localStorage.getItem(PREMIUM_STORAGE_KEY);
      
      let emailPremium = false;
      if (account?.email) {
        emailPremium = localStorage.getItem(`dual_is_premium_${account.email.toLowerCase()}`) === 'true';
      }

      if (currentUserId === OWNER_USER_ID || stored === 'true' || emailPremium || account?.isPremium) {
        setIsPremium(true);
      } else {
        setIsPremium(false);
      }
    }
  };

  useEffect(() => {
    checkStatus();
    setIsInitialized(true);

    const handleStorage = () => checkStatus();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setPremiumStatus = (status: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PREMIUM_STORAGE_KEY, status ? 'true' : 'false');
      const account = getCurrentAccount();
      if (account?.email) {
        localStorage.setItem(`dual_is_premium_${account.email.toLowerCase()}`, status ? 'true' : 'false');
      }
      setIsPremium(status);
      window.dispatchEvent(new Event('storage'));
    }
  };

  const togglePremium = () => {
    setPremiumStatus(!isPremium);
  };

  return { isPremium, setPremiumStatus, togglePremium, isInitialized };
}
