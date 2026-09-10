'use client';

import Link from 'next/link';
import { useState } from 'react';
import { TEAMS } from '@/content/teams';
import { useAdminAction } from './useAdminAction';
import type { AdminGuest } from '@/lib/adminData';

export function GuestTable({
  guests,
  currentGuestId,
}: {
  guests: AdminGuest[];
  currentGuestId: string | null;
}) {
  const { run, pending, error } = useAdminAction();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (guests.length === 0) {
    return (
      <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-5 text-[var(--muted)]">
        Noch keine Gäste angemeldet.
      </p>
    );
  }

  const sorted = [...guests].sort((a, b) => b.points - a.points || a.seq - b.seq);

  return (
    <>
      {error && <p className="mb-3 text-[15px] text-red-700">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-[15px]">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted)]">
              <th className="py-2 pr-3 font-medium">#</th>
              <th className="py-2 pr-3 font-medium">Name</th>
              <th className="py-2 pr-3 font-medium">Team</th>
              <th className="py-2 pr-3 font-medium">Punkte</th>
              <th className="py-2 pr-3 font-medium">Antworten</th>
              <th className="py-2 font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((g) => {
              const active = g.id === currentGuestId;
              return (
                <tr
                  key={g.id}
                  className={`border-b border-[var(--border)] ${
                    active ? 'bg-[var(--accent)]/8' : ''
                  }`}
                >
                  <td className="py-2 pr-3 tabular-nums text-[var(--muted)]">{g.rank}</td>
                  <td className="py-2 pr-3">
                    <Link
                      href={`/admin/guest/${g.id}`}
                      className="font-medium underline decoration-[var(--border)] underline-offset-2"
                    >
                      {g.name}
                    </Link>
                    {active && (
                      <span className="ml-2 text-[13px] text-[var(--muted)]">aktiv</span>
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    <select
                      value={g.team_id ?? ''}
                      disabled={pending !== null}
                      onChange={(e) =>
                        run(g.id, {
                          action: 'setTeam',
                          guestId: g.id,
                          teamId: Number(e.target.value),
                        })
                      }
                      className="min-h-[40px] rounded-lg border border-[var(--border)] bg-white px-2 text-[15px]"
                      style={{ color: g.teamColor }}
                    >
                      {TEAMS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-3 font-semibold tabular-nums">{g.points}</td>
                  <td className="py-2 pr-3 tabular-nums text-[var(--muted)]">
                    {g.answers}
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={pending !== null}
                        onClick={() =>
                          run(
                            g.id,
                            { action: 'impersonate', guestId: g.id },
                            { redirectTo: '/home' },
                          )
                        }
                        className="min-h-[40px] rounded-lg border border-[var(--border)] bg-white px-3"
                      >
                        als Gast öffnen
                      </button>
                      {confirmDelete === g.id ? (
                        <>
                          <button
                            type="button"
                            disabled={pending !== null}
                            onClick={() =>
                              run(g.id, { action: 'deleteGuest', guestId: g.id }).then(
                                () => setConfirmDelete(null),
                              )
                            }
                            className="min-h-[40px] rounded-lg bg-red-700 px-3 font-medium text-white"
                          >
                            wirklich löschen
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(null)}
                            className="min-h-[40px] rounded-lg px-3 text-[var(--muted)]"
                          >
                            abbrechen
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={pending !== null}
                          onClick={() => setConfirmDelete(g.id)}
                          className="min-h-[40px] rounded-lg border border-[var(--border)] bg-white px-3 text-red-700"
                        >
                          löschen
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
