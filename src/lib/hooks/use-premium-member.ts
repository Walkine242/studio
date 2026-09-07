
'use client';
import { useState, useEffect } from 'react';
import { getUserId } from './use-user-profile';

const OWNER_USER_ID = 'user_8r09vt3';
const PREMIUM_STORAGE_KEY = 'dual-is-premium';

export function usePremiumMember() {
    const [isPremium, setIsPremium] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const currentUserId = getUserId();
            const stored = localStorage.getItem(PREMIUM_STORAGE_KEY);
            if (currentUserId === OWNER_USER_ID || stored === 'true') {
                setIsPremium(true);
            } else {
                setIsPremium(false);
            }
        }
        setIsInitialized(true);
    }, []);

    const setPremiumStatus = (status: boolean) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(PREMIUM_STORAGE_KEY, status ? 'true' : 'false');
            setIsPremium(status);
            window.dispatchEvent(new Event('storage'));
        }
    };

    const togglePremium = () => {
        setPremiumStatus(!isPremium);
    };

    return { isPremium, setPremiumStatus, togglePremium, isInitialized };
}

