import { getGuest, getStanding } from '@/lib/guest';
import { supabaseAdmin } from '@/lib/supabase/server';
import { teamById } from '@/content/teams';
import { Card } from '@/components/ui/Card';
import type { TeamRankingRow } from '@/lib/supabase/types';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function RankingPage() {
  const guest = await getGuest();
  if (!guest) redirect('/start');

  const standing = await getStanding(guest);
  const { data } = await supabaseAdmin()
    .from('team_ranking')
    .select('*')
    .order('points', { ascending: false });

  const teams = (data ?? []) as unknown as TeamRankingRow[];
  const leader = teams[0]?.points ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Ranking</h1>
        <p className="text-[var(--muted)]">
          Die Team-Wertung läuft live. Wer solo vorne liegt, wird erst am Abend verraten.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        {teams.map((team, index) => {
          const meta = teamById(team.id);
          const mine = team.id === guest.team_id;
          const width = leader > 0 ? Math.max(4, (team.points / leader) * 100) : 4;

          return (
            <div
              key={team.id}
              className={`rounded-2xl border p-4 ${
                mine ? 'border-[var(--accent)]' : 'border-[var(--border)]'
              } bg-[var(--surface)]`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">
                  <span className="text-[var(--muted)] tabular-nums">{index + 1}. </span>
                  {team.name}
                  {mine && (
                    <span className="ml-2 text-[14px] font-normal text-[var(--muted)]">
                      dein Team
                    </span>
                  )}
                </p>
                <p className="shrink-0 font-semibold tabular-nums">{team.points} P</p>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${width}%`,
                    backgroundColor: meta?.color ?? 'var(--accent)',
                  }}
                />
              </div>
              <p className="mt-2 text-[14px] text-[var(--muted)] tabular-nums">
                {team.members} {team.members === 1 ? 'Mitglied' : 'Mitglieder'}
              </p>
            </div>
          );
        })}
        {teams.length === 0 && (
          <Card>
            <p className="text-[var(--muted)]">Noch keine Team-Punkte.</p>
          </Card>
        )}
      </section>

      <Card>
        <p className="font-semibold">Dein Solo-Ergebnis</p>
        <p className="mt-1 text-[var(--muted)]">
          Du hast <strong className="text-[var(--foreground)]">{standing.points} Punkte</strong>{' '}
          und liegst auf Platz {standing.rank} von {standing.totalGuests}.
        </p>
        <p className="mt-3 text-[14px] text-[var(--muted)]">
          Die Solo-Bestenliste wird beim Finale auf der Leinwand gezeigt.
        </p>
      </Card>
    </div>
  );
}
