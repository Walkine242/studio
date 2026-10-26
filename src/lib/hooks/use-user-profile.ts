
'use client';
import { useState, useEffect } from 'react';
import { UserProfile } from '@/lib/types';
import { countries } from '@/lib/countries';
import { registerUser } from '@/lib/users';
import { getCurrentAccount, type UserAccount } from '@/components/auth/auth-modal';

const PROFILE_STORAGE_KEY = 'aquaSpeed-userProfile';

export const getUserId = (): string | null => {
    if (typeof window !== 'undefined') {
        const account = getCurrentAccount();
        if (account && account.isLoggedIn && account.userId) {
            return account.userId;
        }
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) return storedUserId;
    }
    return null;
};

export function getUserProfile(): UserProfile | null {
    if (typeof window !== 'undefined') {
        try {
            const account = getCurrentAccount();
            if (account && account.isLoggedIn) {
                const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
                if (stored) return JSON.parse(stored);
                return {
                    name: account.name,
                    country: account.country || 'USA',
                };
            }
        } catch {}
    }
    return null;
}

export function useUserProfile() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const loadProfile = () => {
        try {
            const account = getCurrentAccount();
            if (account && account.isLoggedIn) {
                const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
                if (storedProfile) {
                    setProfile(JSON.parse(storedProfile));
                } else {
                    const defaultProf = {
                        name: account.name,
                        country: account.country || 'USA',
                    };
                    setProfile(defaultProf);
                    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(defaultProf));
                }
            } else {
                setProfile(null);
            }
        } catch (error) {
            console.error("Failed to load user profile:", error);
            setProfile(null);
        }
        setIsInitialized(true);
    };

    useEffect(() => {
        loadProfile();
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', loadProfile);
            return () => window.removeEventListener('storage', loadProfile);
        }
    }, []);

    const updateUserProfile = (newProfile: UserProfile) => {
        const uid = getUserId();
        if (!uid) return;
        try {
            setProfile(newProfile);
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
            registerUser({
                id: uid,
                name: newProfile.name,
                country: newProfile.country,
            });
        } catch(error) {
            console.error("Failed to save user profile:", error);
        }
    };

    return { profile, updateUserProfile, isInitialized };
}


    