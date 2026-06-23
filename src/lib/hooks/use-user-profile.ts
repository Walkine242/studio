
'use client';
import { useState, useEffect } from 'react';
import { UserProfile } from '@/lib/types';
import { countries } from '@/lib/countries';

const PROFILE_STORAGE_KEY = 'aquaSpeed-userProfile';

export const getUserId = () => {
    if (typeof window !== 'undefined') {
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substring(2, 9);
            localStorage.setItem('userId', userId);
        }
        return userId;
    }
    return 'default-user';
};

const createInitialProfile = (): UserProfile => {
    const userId = getUserId();
    // Use a hash of the user ID to pick a country consistently
    const hash = userId.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    const country = countries[Math.abs(hash) % countries.length];
    
    return {
        name: userId.replace('_', ' '),
        country: country.code,
    };
};

export function useUserProfile() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        try {
            const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
            if (storedProfile) {
                setProfile(JSON.parse(storedProfile));
            } else {
                const initialProfile = createInitialProfile();
                setProfile(initialProfile);
                localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(initialProfile));
            }
        } catch (error) {
            console.error("Failed to load user profile:", error);
            setProfile(createInitialProfile());
        }
        setIsInitialized(true);
    }, []);

    const updateUserProfile = (newProfile: UserProfile) => {
        try {
            setProfile(newProfile);
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
        } catch(error) {
            console.error("Failed to save user profile:", error);
        }
    };

    return { profile, updateUserProfile, isInitialized };
}

    