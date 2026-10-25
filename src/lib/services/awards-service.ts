'use client';
import type { Award } from '@/lib/types';
import { getSupabase } from '@/lib/supabase/client';

// Awards are created by the database when a Finals race closes
// (see finish_party_internal in the migration), never from the browser.

export async function getAwardsForUser(userId: string): Promise<Award[]> {
  const { data, error } = await getSupabase()
    .from('awards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Failed to load awards:', error);
    return [];
  }
  return (data ?? []).map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    title: r.title,
    meet: r.meet,
    rank: r.rank,
    date: r.created_at,
  }));
}
