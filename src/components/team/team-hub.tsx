'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Check, Crown, Loader2, LogOut, Search, UserMinus, UserPlus, Users, X, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/auth-provider';
import { resolveTeam } from '@/lib/team-logo';
import { getCountryByCode } from '@/lib/countries';
import { TeamLogoBadge } from './team-logo-badge';
import { TeamBuilder } from './team-builder';
import {
  searchTeams, getTeamMembers, getIncomingRequests, getMyRequests, requestToJoin, cancelRequest,
  respondToRequest, leaveTeam, removeMember,
  type TeamSummary, type TeamMember, type JoinRequest,
} from '@/lib/services/team-service';

function Flag({ code }: { code?: string }) {
  const country = code ? getCountryByCode(code) : undefined;
  if (!country) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={country.flag} alt={country.name} className="h-3 rounded-[2px] shadow-sm" />;
}

/**
 * Profile → My Team. Captains design their badge and manage members and join
 * requests; members see their team and can leave; everyone can find a team.
 */
export function TeamHub() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [incoming, setIncoming] = useState<JoinRequest[]>([]);
  const [mine, setMine] = useState<JoinRequest[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const teamRow = (profile?.team ?? null) as { id?: string; owner_id?: string } | null;
  const teamId = teamRow?.id ?? null;
  const isCaptain = !!teamId && teamRow?.owner_id === user?.id;
  const isMember = !!teamId && !isCaptain;
  const team = useMemo(
    () => (user && profile ? resolveTeam(profile.team, user.id, profile.name) : null),
    [user, profile]
  );

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [m, inc, my] = await Promise.all([
        teamId ? getTeamMembers(teamId) : Promise.resolve([]),
        isCaptain && teamId ? getIncomingRequests(teamId) : Promise.resolve([]),
        getMyRequests(user.id),
      ]);
      setMembers(m);
      setIncoming(inc);
      setMine(my);
    } catch (e) {
      // Shown once in the Find a Team card; keep the rest of the tab usable.
      console.warn('Team data unavailable:', e);
    }
  }, [user, teamId, isCaptain]);

  useEffect(() => { load(); }, [load]);

  const run = async (key: string, action: () => Promise<void>, success?: { title: string; description?: string }) => {
    setBusy(key);
    try {
      await action();
      if (success) toast(success);
      await refreshProfile();
      await load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Something went wrong', description: e instanceof Error ? e.message : 'Please try again.' });
    } finally {
      setBusy(null);
    }
  };

  if (!user || !profile || !team) return null;
  const others = members.filter((m) => m.id !== user.id);
  const captainWithMembers = isCaptain && others.length > 0;

  return (
    <div className="space-y-6">
      {/* Your team */}
      {isMember ? (
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-950 via-slate-900 to-rose-950 text-white">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <TeamLogoBadge logo={team.logo} abbr={team.abbr} size={120} />
              <div className="text-center sm:text-left">
                <Badge className="mb-2 bg-white/15 text-white hover:bg-white/15">You swim for</Badge>
                <CardTitle className="text-3xl font-extrabold italic uppercase tracking-wide">{team.name}</CardTitle>
                <CardDescription className="text-slate-300">
                  {members.length} {members.length === 1 ? 'member' : 'members'} · this badge shows for you on the Dual face-off screen
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Roster members={members} captainId={teamRow?.owner_id} meId={user.id} />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto" disabled={busy === 'leave'}>
                  {busy === 'leave' ? <Loader2 className="mr-2 animate-spin" /> : <LogOut className="mr-2" />} Leave Team
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave {team.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You&apos;ll go back to your own team badge. To rejoin later you&apos;d need to ask the captain again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Stay</AlertDialogCancel>
                  <AlertDialogAction onClick={() => run('leave', leaveTeam, { title: `You left ${team.name}` })}>Leave Team</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      ) : (
        <TeamBuilder />
      )}

      {/* Captain tools */}
      {isCaptain && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Users className="size-5" /> Roster</CardTitle>
              <CardDescription>{members.length} of 30 swimmers</CardDescription>
            </CardHeader>
            <CardContent>
              <Roster
                members={members}
                captainId={user.id}
                meId={user.id}
                busy={busy}
                onRemove={(m) => run(`remove-${m.id}`, () => removeMember(m.id), { title: `${m.name} was removed from the team` })}
              />
              {others.length === 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  No teammates yet. Share your team name and swimmers can find it under &ldquo;Find a Team&rdquo;.
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserPlus className="size-5" /> Join Requests
                {incoming.length > 0 && <Badge className="bg-orange-500 hover:bg-orange-500">{incoming.length}</Badge>}
              </CardTitle>
              <CardDescription>Swimmers who want to join your team.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {incoming.length === 0 && <p className="text-sm text-muted-foreground">No pending requests.</p>}
              {incoming.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border p-2 pl-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Flag code={r.swimmerCountry} />
                    <span className="truncate font-medium">{r.swimmerName ?? 'Swimmer'}</span>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="sm"
                      disabled={!!busy}
                      onClick={() => run(`req-${r.id}`, () => respondToRequest(r.id, true), { title: `${r.swimmerName ?? 'Swimmer'} joined your team! 🎉` })}
                    >
                      {busy === `req-${r.id}` ? <Loader2 className="animate-spin" /> : <Check />} Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label="Decline"
                      disabled={!!busy}
                      onClick={() => run(`req-${r.id}`, () => respondToRequest(r.id, false))}
                    >
                      <X />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <FindTeam
        myTeamId={teamId}
        myRequests={mine}
        blocked={captainWithMembers}
        busy={busy}
        onJoin={(t) => run(`join-${t.id}`, () => requestToJoin(t.id), { title: 'Request sent', description: `The captain of ${t.name} will see your request.` })}
        onCancel={(id) => run(`join-${id}`, () => cancelRequest(id), { title: 'Request cancelled' })}
      />
    </div>
  );
}

function Roster({
  members, captainId, meId, onRemove, busy,
}: {
  members: TeamMember[];
  captainId?: string;
  meId: string;
  onRemove?: (m: TeamMember) => void;
  busy?: string | null;
}) {
  const sorted = [...members].sort((a, b) => (a.id === captainId ? -1 : b.id === captainId ? 1 : a.name.localeCompare(b.name)));
  return (
    <ul className="divide-y rounded-lg border">
      {sorted.map((m) => (
        <li key={m.id} className="flex items-center justify-between gap-2 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <Flag code={m.country} />
            <span className="truncate font-medium">{m.name}</span>
            {m.id === captainId && <Crown className="size-4 shrink-0 text-amber-400" aria-label="Captain" />}
            {m.id === meId && <Badge variant="secondary" className="shrink-0">You</Badge>}
          </div>
          {onRemove && m.id !== captainId && (
            <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => onRemove(m)} aria-label={`Remove ${m.name}`}>
              {busy === `remove-${m.id}` ? <Loader2 className="animate-spin" /> : <UserMinus />}
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}

function FindTeam({
  myTeamId, myRequests, blocked, busy, onJoin, onCancel,
}: {
  myTeamId: string | null;
  myRequests: JoinRequest[];
  blocked: boolean;
  busy: string | null;
  onJoin: (t: TeamSummary) => void;
  onCancel: (teamId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TeamSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Search as you type (short delay so we don't query on every keystroke).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await searchTeams(query);
        if (!cancelled) { setResults(r); setError(null); }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load teams.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query]);

  const pending = new Set(myRequests.map((r) => r.teamId));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Search className="size-5" /> Find a Team</CardTitle>
        <CardDescription>
          {blocked
            ? 'You captain a team with members, so you can’t join another team.'
            : 'Ask to join a team. Once the captain accepts, their badge becomes yours on the face-off screen.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by team name or tag…" aria-label="Search teams" />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading && !results && <Loader2 className="mx-auto animate-spin text-muted-foreground" />}
        {results && results.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">No teams found{query ? ` for “${query}”` : ' yet'}.</p>
        )}
        <div className="space-y-2">
          {results?.map((t) => {
            const team = resolveTeam(t, t.captainId, t.captainName);
            const isMine = t.id === myTeamId;
            const isPending = pending.has(t.id);
            return (
              <div key={t.id} className="flex items-center gap-3 rounded-xl border p-2 pr-3">
                <TeamLogoBadge logo={team.logo} abbr={team.abbr} size={52} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold italic uppercase">{t.name}</p>
                  <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <Crown className="size-3 text-amber-400" /> {t.captainName}
                    <Flag code={t.captainCountry} />
                    <span>· {t.members} {t.members === 1 ? 'member' : 'members'}</span>
                  </p>
                </div>
                {isMine ? (
                  <Badge variant="secondary">Your team</Badge>
                ) : isPending ? (
                  <Button size="sm" variant="outline" disabled={!!busy} onClick={() => onCancel(t.id)}>
                    {busy === `join-${t.id}` ? <Loader2 className="animate-spin" /> : <Clock />} Requested
                  </Button>
                ) : (
                  <Button size="sm" disabled={blocked || !!busy || t.members >= 30} onClick={() => onJoin(t)}>
                    {busy === `join-${t.id}` ? <Loader2 className="animate-spin" /> : <UserPlus />} {t.members >= 30 ? 'Full' : 'Ask to Join'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        {myRequests.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Pending: {myRequests.map((r) => r.team?.name ?? 'a team').join(', ')}. Tap &ldquo;Requested&rdquo; to cancel.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
