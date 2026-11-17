'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ProfileLayout } from '@/components/profile/profile-layout';
import type { UserProfileData } from '@/lib/types';
import { getSupabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-provider';

export default function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = React.use(params);
    const { user } = useAuth();
    const router = useRouter();
    const [profileData, setProfileData] = useState<UserProfileData | null | undefined>(undefined);

    // Your own public profile is the editable /profile page.
    useEffect(() => {
        if (user && user.id === userId) router.replace('/profile');
    }, [user, userId, router]);

    useEffect(() => {
        const supabase = getSupabase();
        let cancelled = false;
        (async () => {
            const [{ data: profile }, { data: premium }] = await Promise.all([
                supabase.from('profiles').select('id, name, country').eq('id', userId).maybeSingle(),
                supabase.rpc('is_premium', { uid: userId }),
            ]);
            if (cancelled) return;
            setProfileData(profile ? {
                id: profile.id,
                name: profile.name,
                country: profile.country,
                isCurrentUser: false,
                isPremium: premium === true,
            } : null);
        })();
        return () => { cancelled = true; };
    }, [userId]);

    if (profileData === undefined) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    if (profileData === null) {
        return (
            <div className="container mx-auto text-center py-10">
                <h1 className="text-2xl font-bold">Swimmer not found</h1>
                <p className="text-muted-foreground">This profile doesn't exist.</p>
            </div>
        );
    }

    return <ProfileLayout profileData={profileData} isLoading={false} />;
}
