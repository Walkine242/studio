'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, Users } from 'lucide-react';
import { TeamLogoBadge } from '@/components/team/team-logo-badge';
import { resolveTeam } from '@/lib/team-logo';
import { useAuth } from '@/lib/auth/auth-provider';
import { getTeamLeaderboard, type TeamStanding } from '@/lib/services/team-service';
import { cn } from '@/lib/utils';

const PODIUM = ['from-amber-300 to-yellow-600', 'from-slate-200 to-slate-400', 'from-orange-300 to-amber-700'];

/** Team standings: meet points and dual wins of every team's current members. */
export default function TeamLeaderboardPage() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<TeamStanding[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const myTeamId = (profile?.team as { id?: string } | null)?.id;

  useEffect(() => {
    getTeamLeaderboard()
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load the team leaderboard.'));
  }, []);

  const top3 = rows?.slice(0, 3) ?? [];

  return (
    <div className="container mx-auto max-w-4xl space-y-8">
      <div className="text-center">
        <h1 className="mt-4 font-headline text-3xl font-bold">Team Leaderboard</h1>
        <p className="mt-2 text-muted-foreground">
          Every member&apos;s meet points and Dual wins count towards their team.
        </p>
      </div>

      {error && (
        <Card><CardContent className="pt-6 text-center text-sm text-destructive">{error}</CardContent></Card>
      )}

      {!rows && !error && <Loader2 className="mx-auto size-8 animate-spin text-primary" />}

      {rows && rows.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
            <Shield className="size-10 text-muted-foreground" />
            <p className="font-medium">No teams on the board yet.</p>
            <Button asChild><Link href="/profile?tab=team">Create or join a team</Link></Button>
          </CardContent>
        </Card>
      )}

      {/* Podium */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 items-end gap-3">
          {[1, 0, 2].map((i) => {
            const t = top3[i];
            if (!t) return <div key={i} />;
            const team = resolveTeam(t, t.id, t.name);
            return (
              <div
                key={t.id}
                className={cn(
                  'flex flex-col items-center rounded-2xl border bg-gradient-to-b from-slate-900 to-slate-950 p-3 text-center text-white',
                  i === 0 ? 'pb-6 pt-5' : 'pb-4'
                )}
              >
                <span className={cn('mb-2 rounded-full bg-gradient-to-b px-3 py-0.5 text-xs font-black text-slate-900', PODIUM[i])}>
                  #{i + 1}
                </span>
                <TeamLogoBadge logo={team.logo} abbr={team.abbr} size={i === 0 ? 110 : 84} />
                <p className="mt-2 w-full truncate text-sm font-extrabold italic uppercase">{t.name}</p>
                <p className="text-xs text-slate-400">{t.points} pts · {t.dualWins} wins</p>
              </div>
            );
          })}
        </div>
      )}

      {rows && rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="size-5" /> Standings</CardTitle>
            <CardDescription>Points from meet finals (9-7-6-5-4-3-2-1), then Dual wins break ties.</CardDescription>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="text-right">Dual Wins</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Members</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((t, i) => {
                  const team = resolveTeam(t, t.id, t.name);
                  return (
                    <TableRow key={t.id} className={cn(t.id === myTeamId && 'bg-primary/10')}>
                      <TableCell className="font-bold">{i + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TeamLogoBadge logo={team.logo} abbr={team.abbr} size={36} />
                          <span className="font-semibold">{t.name}</span>
                          {t.id === myTeamId && <span className="text-xs font-bold text-primary">YOU</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold">{t.points}</TableCell>
                      <TableCell className="text-right">{t.dualWins}</TableCell>
                      <TableCell className="hidden text-right sm:table-cell">{t.members}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
