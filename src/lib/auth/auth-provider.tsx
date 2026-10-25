'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabase } from '@/lib/supabase/client';

export interface AuthUser {
  id: string;
  email: string;
}

export interface Profile {
  name: string;
  country: string;
  isAdmin: boolean;
}

interface AuthState {
  user: AuthUser | null;
  profile: Profile | null;
  isPremium: boolean;
  /** True until the first session check finishes. */
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  refreshPremium: () => Promise<void>;
  updateProfile: (data: { name: string; country: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

// Mirror of the signed-in user's id for non-React helpers (getUserId()).
let currentUserId: string | null = null;
export function getCurrentUserId(): string | null {
  return currentUserId;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabase();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string) => {
    const { data } = await supabase.from('profiles').select('name, country, is_admin').eq('id', uid).maybeSingle();
    setProfile(data ? { name: data.name, country: data.country, isAdmin: data.is_admin } : null);
  }, [supabase]);

  const loadPremium = useCallback(async (uid: string) => {
    const { data, error } = await supabase.rpc('is_premium', { uid });
    setIsPremium(!error && data === true);
  }, [supabase]);

  const applySession = useCallback(async (sessionUser: { id: string; email?: string | null } | null) => {
    if (!sessionUser) {
      currentUserId = null;
      setUser(null);
      setProfile(null);
      setIsPremium(false);
      return;
    }
    currentUserId = sessionUser.id;
    setUser({ id: sessionUser.id, email: sessionUser.email ?? '' });
    await Promise.all([loadProfile(sessionUser.id), loadPremium(sessionUser.id)]);
  }, [loadProfile, loadPremium]);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled) return;
      await applySession(data.user);
      if (!cancelled) setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        // Defer so we never call Supabase inside the auth callback itself.
        setTimeout(() => applySession(session?.user ?? null), 0);
      }
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [supabase, applySession]);

  const value = useMemo<AuthState>(() => ({
    user,
    profile,
    isPremium,
    isLoading,
    refreshProfile: async () => { if (user) await loadProfile(user.id); },
    refreshPremium: async () => { if (user) await loadPremium(user.id); },
    updateProfile: async ({ name, country }) => {
      if (!user) throw new Error('You must be logged in.');
      const { error } = await supabase.from('profiles').update({ name: name.trim(), country }).eq('id', user.id);
      if (error) throw error;
      await loadProfile(user.id);
    },
    signOut: async () => {
      await supabase.auth.signOut();
      await applySession(null);
    },
  }), [user, profile, isPremium, isLoading, supabase, loadProfile, loadPremium, applySession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>.');
  return ctx;
}
