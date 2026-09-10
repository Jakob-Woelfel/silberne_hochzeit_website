'use client';

import { useAdminAction } from './useAdminAction';

export function AdminControls({
  preview,
  impersonating,
}: {
  preview: boolean;
  impersonating: string | null;
}) {
  const { run, pending, error } = useAdminAction();

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">Steuerung</h2>
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium">Vorschau-Modus</p>
            <p className="text-[15px] text-[var(--muted)]">
              Hebt alle Freischaltzeiten auf, nur für diesen Browser. Für Gäste
              ändert sich nichts.
            </p>
          </div>
          <button
            type="button"
            disabled={pending !== null}
            onClick={() => run('preview', { action: 'preview', on: !preview })}
            className={`min-h-[44px] shrink-0 rounded-lg px-4 font-medium ${
              preview
                ? 'bg-[var(--accent)] text-white'
                : 'border border-[var(--border)] bg-white'
            }`}
          >
            {preview ? 'an' : 'aus'}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
          <div>
            <p className="font-medium">
              {impersonating
                ? `Du siehst die App gerade als ${impersonating}`
                : 'Keine Gast-Identität aktiv'}
            </p>
            <p className="text-[15px] text-[var(--muted)]">
              In der Gästetabelle unten kannst du in jeden Gast schlüpfen.
            </p>
          </div>
          {impersonating && (
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => run('stop', { action: 'stopImpersonate' })}
              className="min-h-[44px] shrink-0 rounded-lg border border-[var(--border)] bg-white px-4 font-medium"
            >
              Identität ablegen
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
          <p className="text-[15px] text-[var(--muted)]">
            Admin-Sitzung läuft nach 12 Stunden ab.
          </p>
          <button
            type="button"
            disabled={pending !== null}
            onClick={() => run('logout', { action: 'logout' }, { redirectTo: '/admin' })}
            className="min-h-[44px] shrink-0 rounded-lg border border-[var(--border)] bg-white px-4 font-medium"
          >
            Abmelden
          </button>
        </div>

        {error && <p className="text-[15px] text-red-700">{error}</p>}
      </div>
    </section>
  );
}
