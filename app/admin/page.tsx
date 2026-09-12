import Link from 'next/link';
import { hostSecretWarning } from '@/lib/admin';
import { isAdminPreview } from '@/lib/admin';
import {
  checkContent,
  loadOverview,
  moduleStatus,
  orphanSolutions,
  pingDatabase,
} from '@/lib/adminData';
import { unlockAll } from '@/lib/unlock';
import { EVENT_DATE } from '@/content/schedule';
import { getGuestId } from '@/lib/guest';
import { AdminControls } from '@/components/admin/AdminControls';
import { GuestTable } from '@/components/admin/GuestTable';
import { DangerZone } from '@/components/admin/DangerZone';
import { ModuleTable } from '@/components/admin/ModuleTable';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const preview = await isAdminPreview();
  const [db, overview] = await Promise.all([pingDatabase(), loadOverview()]);
  const modulesStatus = await moduleStatus();
  const content = checkContent();
  const orphans = orphanSolutions();
  const warning = hostSecretWarning();
  const impersonating = await getGuestId();
  const impersonatedGuest = overview.guests.find((g) => g.id === impersonating);

  const projectRef =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^https?:\/\//, '').split('.')[0] ??
    'nicht gesetzt';

  return (
    <div className="flex flex-col gap-8">
      {warning && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[15px] text-amber-900">
          {warning}
        </p>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Status</h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Datenbank" value={db.ok ? 'verbunden' : 'Fehler'} note={db.ok ? projectRef : db.message} good={db.ok} />
          <Stat label="Gäste" value={String(overview.totals.guests)} />
          <Stat label="Antworten" value={String(overview.totals.answers)} />
          <Stat label="Punkte gesamt" value={String(overview.totals.points)} />
        </dl>
        <p className="mt-3 text-[15px] text-[var(--muted)]">
          Tag der Feier: {EVENT_DATE}. Alle Sperren aufgehoben per Umgebung:{' '}
          {unlockAll() ? 'ja' : 'nein'}.
        </p>
      </section>

      <AdminControls
        preview={preview}
        impersonating={impersonatedGuest?.name ?? null}
      />

      <ModuleTable
        modules={modulesStatus.modules}
        overridesOk={modulesStatus.overridesOk}
        liveStarted={modulesStatus.liveStarted}
      />

      <section>
        <h2 className="mb-3 text-lg font-semibold">Inhalte</h2>
        <div className="flex flex-col gap-3">
          {content.map((c) => {
            const problems = c.missingSolutions.length > 0;
            return (
              <div
                key={c.level}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold">{c.title}</p>
                  <p className="text-[15px] text-[var(--muted)] tabular-nums">
                    {c.questions} Fragen · max. {c.maxPoints} Punkte
                  </p>
                </div>
                <p className="mt-1 text-[15px] text-[var(--muted)]">
                  {c.questions === 0
                    ? 'Noch keine Fragen hinterlegt.'
                    : Object.entries(c.types)
                        .map(([type, n]) => `${n}× ${type}`)
                        .join(', ')}
                </p>
                {problems && (
                  <p className="mt-2 text-[15px] text-red-700">
                    Ohne Lösung: {c.missingSolutions.join(', ')}
                  </p>
                )}
                {c.placeholders.length > 0 && (
                  <p className="mt-2 text-[15px] text-amber-800">
                    Noch Platzhalter: {c.placeholders.join(', ')}
                  </p>
                )}
              </div>
            );
          })}
          {orphans.length > 0 && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[15px] text-red-800">
              Lösungen ohne passende Frage: {orphans.join(', ')}
            </p>
          )}
          <Link href="/admin/content" className="text-[15px] text-[var(--accent-strong)]">
            Alle Fragen mit Lösungen ansehen →
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Teams</h2>
        <div className="flex flex-col gap-2">
          {overview.teams.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
            >
              <span className="font-medium">{t.name}</span>
              <span className="text-[15px] text-[var(--muted)] tabular-nums">
                {t.points} Punkte · {t.members}{' '}
                {t.members === 1 ? 'Mitglied' : 'Mitglieder'}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Gäste</h2>
        <p className="mb-3 text-[15px] text-[var(--muted)]">
          Vollständiges Solo-Ranking (Level 1–3 voll, Bingo zur Hälfte). Für Gäste ist das verborgen.
        </p>
        <GuestTable guests={overview.guests} currentGuestId={impersonating} />
      </section>

      <DangerZone />
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  good,
}: {
  label: string;
  value: string;
  note?: string;
  good?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <dt className="text-[14px] text-[var(--muted)]">{label}</dt>
      <dd
        className={`mt-0.5 text-xl font-semibold tabular-nums ${
          good === false ? 'text-red-700' : ''
        }`}
      >
        {value}
      </dd>
      {note && <p className="mt-0.5 truncate text-[13px] text-[var(--muted)]">{note}</p>}
    </div>
  );
}
