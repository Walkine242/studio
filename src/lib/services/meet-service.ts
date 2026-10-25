'use client';
import type { Meet } from '@/lib/types';
import { getSupabase } from '@/lib/supabase/client';

function mapMeet(r: any): Meet {
  return {
    id: r.id,
    name: r.name,
    date: r.date,
    events: r.events ?? [],
    isChampionship: r.is_championship,
  };
}

/** Admin only (enforced by the database). */
export async function createMeet(meet: Omit<Meet, 'id'>) {
  const supabase = getSupabase();
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from('meets').insert({
    name: meet.name,
    date: meet.date,
    events: meet.events,
    is_championship: meet.isChampionship ?? false,
    created_by: auth.user?.id ?? null,
  });
  if (error) throw error;
}

export async function getDynamicMeets(): Promise<Meet[]> {
  const { data, error } = await getSupabase().from('meets').select('*').order('date', { ascending: false });
  if (error) {
    console.error('Failed to load meets:', error);
    return [];
  }
  return (data ?? []).map(mapMeet);
}

/** Calls onUpdate with the current meets and again whenever one is added. */
export function subscribeToMeets(onUpdate: (meets: Meet[]) => void) {
  const supabase = getSupabase();
  let active = true;
  const refresh = () => getDynamicMeets().then((m) => active && onUpdate(m));
  refresh();

  const channel = supabase
    .channel(`meets-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'meets' }, refresh)
    .subscribe();

  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}
