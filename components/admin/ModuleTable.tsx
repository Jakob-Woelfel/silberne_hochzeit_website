'use client';

import type { ModuleStatus } from '@/lib/adminData';
import { useAdminAction } from './useAdminAction';

const REASON: Record<ModuleStatus['reason'], { label: string; cls: string }> = {
  open: { label: 'offen', cls: 'bg-green-100 text-green-900' },
  not_yet: { label: 'noch zu', cls: 'bg-[var(--border)] text-[var(--muted)]' },
  closed: { label: 'geschlossen', cls: 'bg-red-100 text-red-900' },
};

function fmtTime(ts: number | null): string {
  if (ts === null) return '—';
  return new Intl.DateTimeFormat('de-DE', { timeStyle: 'short', timeZone: 'Europe/Berlin' }).format(ts);
}

/**
 * Freischaltung mit manueller Steuerung: „Auto“ folgt dem Zeitplan (und der
 * Live-Schließung), „Offen“/„Zu“ gelten sofort für alle Gäste.
 */
export function ModuleTable({
  modules,
  overridesOk,
  liveStarted,
}: {
  modules: ModuleStatus[];
  overridesOk: boolean;
  liveStarted: boolean;
}) {
  const { run, pending, error } = useAdminAction();

  return (
    <section>
      <h2 className="mb-1 text-lg font-semibold">Freischaltung</h2>
      <p className="mb-3 text-[15px] text-[var(--muted)]">
        „Auto“ = Zeitplan; Level und Bingo schließen dann mit der Live-Runde
        {liveStarted ? ' (läuft gerade – deshalb zu)' : ''}. „Offen“ oder „Zu“ überschreibt
        das sofort für alle Gäste, bis du wieder auf „Auto“ stellst.
      </p>
      {!overridesOk && (
        <p className="mb-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[15px] text-red-900">
          Tabelle <code>module_overrides</code> fehlt – bitte{' '}
          <code>supabase/migrations/0004_module_overrides.sql</code> im SQL-Editor ausführen.
          Bis dahin gilt nur der Zeitplan.
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left text-[15px]">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted)]">
              <th className="py-2 pr-4 font-medium">Modul</th>
              <th className="py-2 pr-4 font-medium">Zeitplan</th>
              <th className="py-2 pr-4 font-medium">Für Gäste</th>
              <th className="py-2 font-medium">Steuerung</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((m) => {
              const r = REASON[m.reason];
              const current = m.override ?? 'auto';
              return (
                <tr key={m.key} className="border-b border-[var(--border)]">
                  <td className="py-2 pr-4">{m.label}</td>
                  <td className="py-2 pr-4 tabular-nums">
                    {m.key === 'live' ? 'per Host-Panel' : `${m.time ?? '—'} (${fmtTime(m.unlockAt)})`}
                  </td>
                  <td className="py-2 pr-4">
                    <span className={`rounded-full px-2.5 py-0.5 ${r.cls}`}>{r.label}</span>
                  </td>
                  <td className="py-2">
                    {m.controllable ? (
                      <div className="flex gap-1">
                        {(['auto', 'open', 'closed'] as const).map((state) => (
                          <button
                            key={state}
                            type="button"
                            disabled={pending !== null || !overridesOk}
                            onClick={() => run(`${m.key}:${state}`, { action: 'setModule', key: m.key, state })}
                            className={`min-h-[40px] rounded-lg px-3 text-[14px] font-medium disabled:opacity-40 ${
                              current === state
                                ? 'bg-[var(--accent)] text-white'
                                : 'border border-[var(--border)] bg-white'
                            }`}
                          >
                            {state === 'auto' ? 'Auto' : state === 'open' ? 'Offen' : 'Zu'}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[var(--muted)]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {error && <p className="mt-2 text-[15px] text-red-700">{error}</p>}
    </section>
  );
}
