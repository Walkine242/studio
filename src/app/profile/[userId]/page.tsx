
'use client';
import React from 'react';
import { ProfileLayout } from '@/components/profile/profile-layout';
import type { UserProfileData } from '@/lib/types';
import { countries } from '@/lib/countries';

// This is mock data. In a real app, you'd fetch this from a service.
const getMockProfileData = (userId: string): UserProfileData => {
    const country = countries[Math.abs(userId.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)) % countries.length];
    
    // All users have full free access
    const isPremium = true;

    return {
        id: userId,
        name: `Swimmer ${userId.slice(5, 9)}`,
        country: country.code,
        isCurrentUser: false,
        isPremium: true,
    };
};

export default function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = React.use(params);
    
    if (typeof userId !== 'string') {
        return <div>User not found.</div>;
    }

    const profileData = getMockProfileData(userId);

    return (
       <ProfileLayout profileData={profileData} isLoading={false} />
    );
}
