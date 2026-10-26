'use client';
import { useState } from 'react';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { Loader2, UserPlus, Sparkles, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AuthModal } from '@/components/auth/auth-modal';
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
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    
    const handleSave = async (newProfileData: { name: string; country: string }) => {
        setIsSaving(true);
        try {
            await updateUserProfile(newProfileData);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Could Not Save Profile', description: error instanceof Error ? error.message : 'Please try again.' });
        }
        setIsSaving(false);
    };
    
    const isReady = isProfileInitialized && isPremiumInitialized;

    if (!isReady) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    // Not logged in: invite them to create an account.
    if (!user || !profile) {
        return (
            <div className="container mx-auto max-w-3xl py-12 px-4 space-y-6">
                <Card className="bg-slate-950/90 text-white border-slate-800 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Trophy className="size-48 text-cyan-400" />
                    </div>
                    <CardHeader className="text-center space-y-3 pt-8">
                        <div className="size-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center mx-auto shadow-lg">
                            <Sparkles className="size-8 text-white animate-pulse" />
                        </div>
                        <CardTitle className="font-headline text-3xl font-extrabold text-white">
                            Create Your Swimmer Profile
                        </CardTitle>
                        <CardDescription className="text-slate-300 text-sm max-w-md mx-auto">
                            Join Dual Swim to track your official personal bests, compete in head-to-head dual race lobbies, set training goals, and sync wearable telemetry.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-4 pb-8 pt-4">
                        <Button
                            onClick={() => setIsAuthOpen(true)}
                            size="lg"
                            className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm px-8 shadow-xl"
                        >
                            <UserPlus className="mr-2 size-5" /> Create Account / Log In
                        </Button>
                    </CardContent>
                </Card>
                <AuthModal open={isAuthOpen} onOpenChange={setIsAuthOpen} />
            </div>
        );
    }

    const profileData: UserProfileData = {
        ...profile,
        id: user.id,
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
