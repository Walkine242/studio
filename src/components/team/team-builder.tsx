'use client';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shuffle, Save, Loader2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/auth-provider';
import { TeamLogoBadge } from './team-logo-badge';
import {
  resolveTeam, defaultLogo, makeAbbr,
  LOGO_SHAPES, LOGO_EMBLEMS, SHAPE_LABELS, EMBLEM_LABELS,
  PRIMARY_COLORS, SECONDARY_COLORS, ACCENT_COLORS,
  type TeamLogo,
} from '@/lib/team-logo';
import { cn } from '@/lib/utils';

const COLOR_ROWS: { key: 'primary' | 'secondary' | 'accent'; label: string; colors: string[] }[] = [
  { key: 'primary', label: 'Main colour', colors: PRIMARY_COLORS },
  { key: 'secondary', label: 'Trim & lettering', colors: SECONDARY_COLORS },
  { key: 'accent', label: 'Emblem colour', colors: ACCENT_COLORS },
];

/** Lets the signed-in swimmer design their team name, tag and logo. */
export function TeamBuilder() {
  const { user, profile, saveTeam } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [abbr, setAbbr] = useState('');
  const [abbrEdited, setAbbrEdited] = useState(false);
  const [logo, setLogo] = useState<TeamLogo | null>(null);
  const [saving, setSaving] = useState(false);

  const current = useMemo(
    () => (user && profile ? resolveTeam(profile.team, user.id, profile.name) : null),
    [user, profile]
  );

  useEffect(() => {
    if (!current) return;
    setName(current.saved ? current.name : '');
    setAbbr(current.abbr);
    setAbbrEdited(current.saved);
    setLogo(current.logo);
  }, [current]);

  if (!user || !profile || !current || !logo) return null;

  const cleanName = name.trim();
  const cleanAbbr = abbr.trim().toUpperCase();
  const valid = cleanName.length >= 2 && cleanName.length <= 30 && /^[A-Z0-9]{1,4}$/.test(cleanAbbr);
  const dirty =
    !current.saved ||
    cleanName !== current.name ||
    cleanAbbr !== current.abbr ||
    (Object.keys(logo) as (keyof TeamLogo)[]).some((k) => logo[k] !== current.logo[k]);

  const onName = (value: string) => {
    setName(value);
    if (!abbrEdited) setAbbr(makeAbbr(value || profile.name));
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveTeam({ name: cleanName, abbr: cleanAbbr, logo: { ...logo } });
      toast({ title: 'Team Saved', description: 'Your logo now appears on the Dual face-off screen.' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      toast({
        variant: 'destructive',
        title: 'Could Not Save Team',
        description: /save_my_team|function|schema cache/i.test(msg)
          ? 'The teams update for the database hasn\'t been installed yet (run the teams SQL file in Supabase).'
          : msg || 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="size-5" /> My Team</CardTitle>
        <CardDescription>
          Design your team logo. It shows on the Dual face-off screen when you race, and later other swimmers will be able to join your team.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-8 md:grid-cols-[240px_1fr]">
        {/* Preview */}
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 p-6 text-white md:sticky md:top-24 md:self-start">
          <TeamLogoBadge logo={logo} abbr={cleanAbbr || current.abbr} size={170} />
          <div className="text-center">
            <p className="text-lg font-extrabold italic uppercase tracking-wide">{cleanName || current.name}</p>
            <p className="text-xs text-slate-400">Captain: {profile.name}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team name</Label>
              <Input id="team-name" value={name} maxLength={30} placeholder="e.g. Tidal Sharks" onChange={(e) => onName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-abbr">Tag</Label>
              <Input
                id="team-abbr"
                value={abbr}
                maxLength={4}
                placeholder="SHK"
                className="uppercase font-bold tracking-wider"
                onChange={(e) => { setAbbr(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setAbbrEdited(true); }}
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Emblem</p>
            <div className="grid grid-cols-5 gap-2">
              {LOGO_EMBLEMS.map((emblem) => (
                <button
                  key={emblem}
                  type="button"
                  onClick={() => setLogo({ ...logo, emblem })}
                  aria-pressed={logo.emblem === emblem}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border p-2 text-[11px] transition-colors',
                    logo.emblem === emblem ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-input hover:bg-muted'
                  )}
                >
                  <TeamLogoBadge logo={{ ...logo, emblem }} abbr={cleanAbbr || current.abbr} size={48} title={EMBLEM_LABELS[emblem]} />
                  <span className="leading-tight">{EMBLEM_LABELS[emblem]}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Crest shape</p>
            <div className="grid grid-cols-6 gap-2">
              {LOGO_SHAPES.map((shape) => (
                <button
                  key={shape}
                  type="button"
                  onClick={() => setLogo({ ...logo, shape })}
                  aria-pressed={logo.shape === shape}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border p-2 text-[11px] transition-colors',
                    logo.shape === shape ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-input hover:bg-muted'
                  )}
                >
                  <TeamLogoBadge logo={{ ...logo, shape }} abbr="" size={40} title={SHAPE_LABELS[shape]} />
                  <span className="hidden leading-tight sm:block">{SHAPE_LABELS[shape]}</span>
                </button>
              ))}
            </div>
          </div>

          {COLOR_ROWS.map((row) => (
            <div key={row.key}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{row.label}</p>
              <div className="flex flex-wrap gap-2">
                {row.colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setLogo({ ...logo, [row.key]: c })}
                    aria-label={`${row.label} ${c}`}
                    aria-pressed={logo[row.key] === c}
                    className={cn(
                      'size-8 rounded-full border-2 transition-transform hover:scale-110',
                      logo[row.key] === c ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border-white/30'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setLogo(defaultLogo(`${user.id}-${Date.now()}`))}>
              <Shuffle className="mr-2" /> Surprise Me
            </Button>
            <Button type="button" onClick={save} disabled={!valid || !dirty || saving}>
              {saving ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
              {!dirty ? 'Saved' : current.saved ? 'Save Changes' : 'Create Team'}
            </Button>
            {!valid && (
              <span className="text-xs text-muted-foreground">Name needs 2–30 characters and a tag of 1–4 letters or numbers.</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
