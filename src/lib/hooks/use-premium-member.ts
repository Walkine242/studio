
'use client';
import { useState, useEffect } from 'react';
import { getUserId } from './use-user-profile';

const OWNER_USER_ID = 'user_8r09vt3';

export function usePremiumMember() {
    const [isPremium, setIsPremium] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const currentUserId = getUserId();
        if (currentUserId === OWNER_USER_ID) {
            setIsPremium(true);
        } else {
            setIsPremium(false);
        }
        setIsInitialized(true);
    }, []);

    // The toggle function is no longer needed for other users.
    // It can be kept for potential future admin controls, but for now, it does nothing for non-owners.
    const togglePremium = () => {
        const currentUserId = getUserId();
        if (currentUserId !== OWNER_USER_ID) {
            console.warn("Only the owner can toggle premium status.");
        }
        // For the owner, the status is always premium, so toggling is disabled.
    };

    return { isPremium, togglePremium, isInitialized };
}
