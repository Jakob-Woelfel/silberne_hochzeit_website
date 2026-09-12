import { notFound } from 'next/navigation';
import { isAdmin, keyMatches } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { BINGO_PREFIX, bingoFieldById, bingoFieldsFor } from '@/content/bingo';
import { teamById } from '@/content/teams';
import { selfieUrl } from '@/lib/selfies';
import { AutoRefresh } from '@/components/screen/AutoRefresh';

export const dynamic = 'force-dynamic';

type Row = {
  task_id: string;
  storage_path: string;
  created_at: string;
  guests: { id: string; name: string; team_id: number | null } | null;
};

/**
 * Beamer-Galerie aller Selfies, neueste zuerst. Zugang wie /admin:
 * Cookie oder ?key=<HOST_SECRET>. Aktualisiert sich alle 20 s.
 */
export default async function GalleryPage({ searchParams }: PageProps<'/screen/gallery'>) {
  const { key } = await searchParams;
  const allowed = (await isAdmin()) || keyMatches(typeof key === 'string' ? key : null);
  if (!allowed) notFound();

  const { data } = await supabaseAdmin()
    .from('uploads')
    .select('task_id, storage_path, created_at, guests(id, name, team_id)')
    .order('created_at', { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];

  return (
    <div className="min-h-full bg-[#1c1917] px-6 py-6 text-white">
      <AutoRefresh seconds={20} />
      <header className="mb-5 flex items-baseline justify-between gap-4">
        <h1 className="text-3xl font-semibold">Selfie-Bingo</h1>
        <p className="text-lg text-white/70 tabular-nums">
          {rows.length} {rows.length === 1 ? 'Selfie' : 'Selfies'}
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="text-2xl text-white/70">Noch keine Selfies – los geht’s!</p>
      ) : (
        <div className="grid grid-cols-3 gap-4 md:grid-cols-4 xl:grid-cols-6">
          {rows.map((row) => {
            const team = teamById(row.guests?.team_id);
            const version = Date.parse(row.created_at) || 0;
            // Feldnummer ist pro Gast (eigenes Grid)
            const index = row.guests
              ? bingoFieldsFor(row.guests.id).findIndex((f) => f.id === row.task_id) + 1
              : 0;
            const text = bingoFieldById(row.task_id)?.text.replace(/^…\s*/, '') ?? row.task_id;
            return (
              <figure
                key={`${row.storage_path}-${version}`}
                className="overflow-hidden rounded-2xl bg-white/5"
                style={{ boxShadow: `inset 0 0 0 4px ${team?.color ?? '#888'}` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- Storage-URL */}
                <img
                  src={`${selfieUrl(row.storage_path)}?v=${version}`}
                  alt=""
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
                <figcaption className="px-3 py-2">
                  <p className="truncate text-lg font-semibold">
                    {row.guests?.name ?? '–'}
                    <span className="ml-2 text-base font-normal text-white/60">
                      {team?.name ?? ''}
                    </span>
                  </p>
                  <p className="line-clamp-2 text-sm text-white/70">
                    {index > 0 ? `${index} · ` : ''}
                    {BINGO_PREFIX} {text}
                  </p>
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}
    </div>
  );
}
