'use client';

import { useState } from 'react';
import { useAdminAction } from './useAdminAction';

const PHRASE = 'ALLES LOESCHEN';

export function DangerZone() {
  const { run, pending, error } = useAdminAction();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-red-800">Zurücksetzen</h2>
      <div className="rounded-xl border border-red-300 bg-red-50 p-4">
        <p className="text-[15px] text-red-900">
          Löscht alle Gäste, Antworten und Uploads. Teams und Live-Session bleiben
          bestehen. Vor der Feier einmal ausführen, damit keine Testdaten in die
          Wertung laufen.
        </p>

        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-3 min-h-[44px] rounded-lg border border-red-400 bg-white px-4 font-medium text-red-800"
          >
            Zurücksetzen vorbereiten
          </button>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            <label className="text-[15px] text-red-900">
              Zum Bestätigen <strong>{PHRASE}</strong> eintippen:
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[52px] w-full max-w-sm rounded-lg border border-red-300 bg-white px-4"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending !== null || text !== PHRASE}
                onClick={() =>
                  run('reset', { action: 'resetAll', confirm: text }).then((ok) => {
                    if (ok) {
                      setOpen(false);
                      setText('');
                    }
                  })
                }
                className="min-h-[44px] rounded-lg bg-red-700 px-4 font-medium text-white disabled:opacity-40"
              >
                {pending ? 'Läuft …' : 'Endgültig löschen'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setText('');
                }}
                className="min-h-[44px] rounded-lg px-4 text-red-800"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-3 text-[15px] text-red-800">{error}</p>}
      </div>
    </section>
  );
}
