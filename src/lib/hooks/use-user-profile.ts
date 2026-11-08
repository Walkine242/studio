'use client';
import type { UserProfile } from '@/lib/types';
import { getCurrentUserId, useAuth } from '@/lib/auth/auth-provider';

/** The signed-in user's id, or null when logged out. */
export const getUserId = (): string | null => getCurrentUserId();

export function useUserProfile() {
  const { profile, updateProfile, isLoading } = useAuth();

  const updateUserProfile = async (newProfile: UserProfile) => {
    await updateProfile({ name: newProfile.name, country: newProfile.country });
  };

  return {
    profile: profile ? { name: profile.name, country: profile.country } : null,
    updateUserProfile,
    isInitialized: !isLoading,
  };
}
