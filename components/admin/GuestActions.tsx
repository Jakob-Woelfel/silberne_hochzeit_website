'use client';

import { useState } from 'react';
import { useAdminAction } from './useAdminAction';

export function GuestActions({ guestId, name }: { guestId: string; name: string }) {
  const { run, pending, error } = useAdminAction();
  const [newName, setNewName] = useState(name);
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[14px] text-[var(--muted)]">Name korrigieren</span>
          <input
            type="text"
            value={newName}
            maxLength={40}
            onChange={(e) => setNewName(e.target.value)}
            className="min-h-[44px] w-56 rounded-lg border border-[var(--border)] bg-white px-3"
          />
        </label>
        <button
          type="button"
          disabled={pending !== null || newName.trim() === name || newName.trim().length < 2}
          onClick={() => run('rename', { action: 'renameGuest', guestId, name: newName })}
          className="min-h-[44px] rounded-lg border border-[var(--border)] bg-white px-4 font-medium disabled:opacity-40"
        >
          Speichern
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
        <button
          type="button"
          disabled={pending !== null}
          onClick={() =>
            run('impersonate', { action: 'impersonate', guestId }, { redirectTo: '/home' })
          }
          className="min-h-[44px] rounded-lg border border-[var(--border)] bg-white px-4 font-medium"
        >
          App als {name} öffnen
        </button>

        {confirmClear ? (
          <>
            <button
              type="button"
              disabled={pending !== null}
              onClick={() =>
                run('clear', { action: 'clearAnswers', guestId }).then(() =>
                  setConfirmClear(false),
                )
              }
              className="min-h-[44px] rounded-lg bg-red-700 px-4 font-medium text-white"
            >
              Antworten wirklich löschen
            </button>
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="min-h-[44px] rounded-lg px-4 text-[var(--muted)]"
            >
              abbrechen
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={pending !== null}
            onClick={() => setConfirmClear(true)}
            className="min-h-[44px] rounded-lg border border-[var(--border)] bg-white px-4 font-medium text-red-700"
          >
            Antworten zurücksetzen
          </button>
        )}
      </div>

      {error && <p className="text-[15px] text-red-700">{error}</p>}
    </div>
  );
}
