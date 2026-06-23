'use client';
import { useState, useEffect } from 'react';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { Loader2 } from 'lucide-react';
import { ProfileLayout } from '@/components/profile/profile-layout';
import type { UserProfileData } from '@/lib/types';
import { usePremiumMember } from '@/lib/hooks/use-premium-member';


const getUserId = () => {
    if (typeof window !== 'undefined') {
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substring(2, 9);
            localStorage.setItem('userId', userId);
        }
        return userId;
    }
    return null;
}

export default function ProfilePage() {
    const { profile, updateUserProfile, isInitialized: isProfileInitialized } = useUserProfile();
    const { isPremium, isInitialized: isPremiumInitialized } = usePremiumMember();
    const [isSaving, setIsSaving] = useState(false);
    
    const handleSave = async (newProfileData: { name: string; country: string }) => {
        setIsSaving(true);
        await updateUserProfile(newProfileData);
        setIsSaving(false);
    };
    
    const isReady = isProfileInitialized && isPremiumInitialized && profile;

    if (!isReady) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    const profileData: UserProfileData = {
        ...profile,
        id: getUserId()!,
        isCurrentUser: true,
        isPremium: isPremium
    };

    const isLoading = isSaving || !isReady;

    return (
        <ProfileLayout 
            profileData={profileData} 
            isLoading={isLoading}
            onProfileSave={handleSave}
        />
    );
}
