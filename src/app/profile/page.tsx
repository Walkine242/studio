'use client';
import { useState } from 'react';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { Loader2 } from 'lucide-react';
import { ProfileLayout } from '@/components/profile/profile-layout';
import type { UserProfileData } from '@/lib/types';
import { usePremiumMember } from '@/lib/hooks/use-premium-member';
import { useAuth } from '@/lib/auth/auth-provider';
import { useToast } from '@/hooks/use-toast';


export default function ProfilePage() {
    const { profile, updateUserProfile, isInitialized: isProfileInitialized } = useUserProfile();
    const { isPremium, isInitialized: isPremiumInitialized } = usePremiumMember();
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    const handleSave = async (newProfileData: { name: string; country: string }) => {
        setIsSaving(true);
        try {
            await updateUserProfile(newProfileData);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Could Not Save Profile', description: error instanceof Error ? error.message : 'Please try again.' });
        }
        setIsSaving(false);
    };
    
    const isReady = isProfileInitialized && isPremiumInitialized && profile && user;

    if (!isReady) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    const profileData: UserProfileData = {
        ...profile,
        id: user!.id,
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
