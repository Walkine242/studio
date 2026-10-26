'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shuffle, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/auth-provider';
import { SwimmerAvatar, AvatarStyles } from './swimmer-avatar';
import {
  resolveLook, defaultLook,
  SKIN_TONES, CAP_COLORS, SUIT_COLORS, STRIPE_COLORS, LENS_COLORS,
  type AvatarLook,
} from '@/lib/avatar';
import { cn } from '@/lib/utils';

const ROWS: { key: keyof AvatarLook; label: string; colors: string[] }[] = [
  { key: 'skin', label: 'Skin tone', colors: SKIN_TONES },
  { key: 'cap', label: 'Swim cap', colors: CAP_COLORS },
  { key: 'lens', label: 'Goggle lenses', colors: LENS_COLORS },
  { key: 'suit', label: 'Suit', colors: SUIT_COLORS },
  { key: 'stripe', label: 'Suit stripe', colors: STRIPE_COLORS },
];

/** Lets the signed-in swimmer design the 3D avatar shown in race lobbies. */
export function AvatarCustomizer() {
  const { user, profile, updateAvatar } = useAuth();
  const { toast } = useToast();
  const [look, setLook] = useState<AvatarLook | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setLook(resolveLook(profile?.avatar, user.id));
  }, [user, profile?.avatar]);

  if (!user || !profile || !look) return null;

  const saved = resolveLook(profile.avatar, user.id);
  const dirty = (Object.keys(look) as (keyof AvatarLook)[]).some((k) => look[k] !== saved[k]);

  const shuffle = () => setLook(defaultLook(`${user.id}-${Date.now()}`));

  const save = async () => {
    setSaving(true);
    try {
      await updateAvatar({ ...look });
      toast({ title: 'Avatar Saved', description: 'Other swimmers will see this look in race lobbies.' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      toast({
        variant: 'destructive',
        title: 'Could Not Save Avatar',
        description: /avatar/.test(msg)
          ? 'The avatar update for the database hasn\'t been installed yet (run the avatar SQL file in Supabase).'
          : msg || 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <AvatarStyles />
      <CardHeader>
        <CardTitle>Your Swimmer</CardTitle>
        <CardDescription>Design the 3D avatar other swimmers see on the blocks in race lobbies.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[200px_1fr] items-center">
        <div className="mx-auto flex flex-col items-center rounded-2xl bg-gradient-to-b from-sky-900 to-sky-600 px-6 pt-4 pb-3">
          <SwimmerAvatar look={look} name={profile.name} capText={profile.country} />
          <span className="mt-1 text-sm font-bold text-white">{profile.name}</span>
        </div>

        <div className="space-y-4">
          {ROWS.map((row) => (
            <div key={row.key}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{row.label}</p>
              <div className="flex flex-wrap gap-2">
                {row.colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setLook({ ...look, [row.key]: c })}
                    aria-label={`${row.label} ${c}`}
                    aria-pressed={look[row.key] === c}
                    className={cn(
                      'size-8 rounded-full border-2 transition-transform hover:scale-110',
                      look[row.key] === c ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border-white/30'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" variant="outline" onClick={shuffle}>
              <Shuffle className="mr-2" /> Surprise Me
            </Button>
            <Button type="button" onClick={save} disabled={!dirty || saving}>
              {saving ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
              {dirty ? 'Save Avatar' : 'Saved'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
