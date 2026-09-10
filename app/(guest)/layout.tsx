import { redirect } from 'next/navigation';
import { getGuest, getStanding } from '@/lib/guest';
import { teamById } from '@/content/teams';
import { BottomNav } from '@/components/BottomNav';

export const dynamic = 'force-dynamic';

export default async function GuestLayout({ children }: LayoutProps<'/'>) {
  const guest = await getGuest();
  if (!guest) redirect('/start');

  const standing = await getStanding(guest);
  const team = teamById(guest.team_id);

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">{guest.name}</p>
            {team && (
              <p className="flex items-center gap-1.5 text-[13px] text-[var(--muted)]">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: team.color }}
                  aria-hidden
                />
                {team.name}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[15px] font-semibold tabular-nums">
              {standing.points} Punkte
            </p>
            <p className="text-[13px] text-[var(--muted)] tabular-nums">
              Platz {standing.rank} von {standing.totalGuests}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-28 pt-5">{children}</main>

      <BottomNav />
    </div>
  );
}
