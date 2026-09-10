import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadGuestDetail } from '@/lib/adminData';
import { questionById } from '@/content/levels';
import { SOLUTIONS } from '@/content/levels.solutions';
import { teamById } from '@/content/teams';
import { GuestActions } from '@/components/admin/GuestActions';

export const dynamic = 'force-dynamic';

export default async function AdminGuestPage({ params }: PageProps<'/admin/guest/[id]'>) {
  const { id } = await params;
  const { guest, answers } = await loadGuestDetail(id);
  if (!guest) notFound();

  const team = teamById(guest.team_id);
  const total = answers.reduce((sum, a) => sum + a.points, 0);
  const soloTotal = answers
    .filter((a) => /^l[0-9]+_/.test(a.task_id))
    .reduce((sum, a) => sum + a.points, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin" className="text-[15px] text-[var(--muted)]">
          ← zurück
        </Link>
        <h1 className="mt-1 text-xl font-semibold">{guest.name}</h1>
        <p className="text-[15px] text-[var(--muted)]">
          {team?.name ?? 'ohne Team'} · angemeldet als Nummer {guest.seq} ·{' '}
          <code className="text-[13px]">{guest.id}</code>
        </p>
        <p className="mt-1 text-[15px] text-[var(--muted)] tabular-nums">
          Solo {soloTotal} Punkte · gesamt {total} Punkte · {answers.length} Antworten
        </p>
      </div>

      <GuestActions guestId={guest.id} name={guest.name} />

      <section>
        <h2 className="mb-3 text-lg font-semibold">Antworten</h2>
        {answers.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-5 text-[var(--muted)]">
            Noch nichts beantwortet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {answers.map((a) => {
              const q = questionById(a.task_id);
              const s = SOLUTIONS[a.task_id];
              return (
                <div
                  key={a.task_id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <code className="text-[14px] text-[var(--muted)]">{a.task_id}</code>
                    <span className="font-semibold tabular-nums">{a.points} P</span>
                  </div>
                  {q && <p className="mt-1 text-[15px]">{q.prompt}</p>}
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-[var(--background)] p-3 text-[13px]">
                    {JSON.stringify(a.value)}
                  </pre>
                  {s && (
                    <p className="mt-1 text-[14px] text-[var(--muted)]">
                      Lösung: {JSON.stringify(s)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
