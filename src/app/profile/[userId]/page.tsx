
'use client';
import { ProfileLayout } from '@/components/profile/profile-layout';
import type { UserProfileData } from '@/lib/types';
import { countries } from '@/lib/countries';

// This is mock data. In a real app, you'd fetch this from a service.
const getMockProfileData = (userId: string): UserProfileData => {
    const country = countries[Math.abs(userId.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)) % countries.length];
    
    // Mock premium status for some users
    const isPremium = userId.includes('2') || userId.includes('5');

    return {
        id: userId,
        name: `Swimmer ${userId.slice(5, 9)}`,
        country: country.code,
        isCurrentUser: false,
        isPremium: isPremium,
    };
};

export default function UserProfilePage({ params }: { params: { userId: string } }) {
    const { userId } = params;
    
    if (typeof userId !== 'string') {
        return <div>User not found.</div>;
    }

    const profileData = getMockProfileData(userId);

    return (
       <ProfileLayout profileData={profileData} isLoading={false} />
    );
}
