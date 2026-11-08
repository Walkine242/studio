'use client';
import { getCountryByCode, type Country } from './countries';
import { getSupabase } from '@/lib/supabase/client';
import { getUserId } from '@/lib/hooks/use-user-profile';

export interface Friend {
  id: string;
  name: string;
  country: Country;
  avatar: string;
}

export interface SwimmerListItem {
  id: string;
  name: string;
  country: string;
}

const fallbackCountry = (code: string): Country =>
  getCountryByCode(code) ?? getCountryByCode('USA')!;

/** Swimmers the signed-in user follows. */
export async function getFriends(): Promise<Friend[]> {
  const { data: auth } = await getSupabase().auth.getUser();
  const me = auth.user?.id;
  if (!me) return [];
  const list = await getFollowing(me);
  return list.map((s) => ({ id: s.id, name: s.name, country: fallbackCountry(s.country), avatar: '' }));
}

export async function getFollowing(userId: string): Promise<SwimmerListItem[]> {
  const { data, error } = await getSupabase()
    .from('follows')
    .select('following:profiles!follows_following_id_fkey(id, name, country)')
    .eq('follower_id', userId);
  if (error) {
    console.error('Failed to load following:', error);
    return [];
  }
  return (data ?? []).map((r: any) => r.following).filter(Boolean);
}

export async function getFollowers(userId: string): Promise<SwimmerListItem[]> {
  const { data, error } = await getSupabase()
    .from('follows')
    .select('follower:profiles!follows_follower_id_fkey(id, name, country)')
    .eq('following_id', userId);
  if (error) {
    console.error('Failed to load followers:', error);
    return [];
  }
  return (data ?? []).map((r: any) => r.follower).filter(Boolean);
}

export async function followSwimmer(userId: string) {
  const me = getUserId();
  if (!me) throw new Error('You must be logged in.');
  const { error } = await getSupabase().from('follows').insert({ follower_id: me, following_id: userId });
  if (error && error.code !== '23505') throw error; // 23505 = already following
}

export async function unfollowSwimmer(userId: string) {
  const me = getUserId();
  if (!me) return;
  const { error } = await getSupabase().from('follows').delete().eq('follower_id', me).eq('following_id', userId);
  if (error) throw error;
}

export async function removeFollower(userId: string) {
  const me = getUserId();
  if (!me) return;
  const { error } = await getSupabase().from('follows').delete().eq('follower_id', userId).eq('following_id', me);
  if (error) throw error;
}

export async function searchSwimmers(term: string): Promise<SwimmerListItem[]> {
  const cleaned = term.trim().replace(/[%_,()]/g, '');
  if (!cleaned) return [];
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('id, name, country')
    .ilike('name', `%${cleaned}%`)
    .limit(20);
  if (error) {
    console.error('Search failed:', error);
    return [];
  }
  return data ?? [];
}
