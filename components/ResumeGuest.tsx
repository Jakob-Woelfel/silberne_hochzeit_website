'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { persistGuestId } from '@/lib/guestClient';

type Entry = { id: string; name: string; team: string | null };

/**
 * „Ich war schon dabei“: Gast wählt seinen Namen aus der Liste und übernimmt
 * die alte Identität (Kickoff 6.2). Es wird nichts angelegt oder geändert.
 */
export function ResumeGuest({ onCancel }: { onCancel: () => void }) {
  const router = useRouter();
  const [guests, setGuests] = useState<Entry[] | null>(null);
  const [filter, setFilter] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/guest', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setGuests(d.guests ?? []))
      .catch(() => setError('Liste konnte nicht geladen werden.'));
  }, []);

  async function resume(entry: Entry) {
    if (pending) return;
    setPending(entry.id);
    setError(null);
    try {
      const res = await fetch('/api/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId: entry.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Das hat nicht geklappt.');
        setPending(null);
        return;
      }
      persistGuestId(data.id);
      router.replace('/home');
    } catch {
      setError('Keine Verbindung. Bitte noch einmal versuchen.');
      setPending(null);
    }
  }

  const needle = filter.trim().toLowerCase();
  const shown = (guests ?? []).filter((g) => !needle || g.name.toLowerCase().includes(needle));

  return (
    <div className="mt-8 flex flex-col gap-4">
      <div>
        <p className="font-medium">Ich war schon dabei</p>
        <p className="text-[15px] text-[var(--muted)]">
          Tipp auf deinen Namen – dein Punktestand und dein Team bleiben erhalten.
        </p>
      </div>
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Namen suchen"
        autoFocus
        className="min-h-[56px] w-full rounded-xl border border-[var(--border)] bg-white px-4 outline-none focus:border-[var(--accent)]"
      />
      {error && <p className="text-[15px] text-red-700">{error}</p>}
      {guests === null ? (
        <p className="text-[var(--muted)]">Lade Liste …</p>
      ) : shown.length === 0 ? (
        <p className="text-[var(--muted)]">Niemand gefunden.</p>
      ) : (
        <ul className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
          {shown.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => resume(g)}
                className="flex min-h-[56px] w-full items-center justify-between rounded-xl border border-[var(--border)] bg-white px-4 text-left font-medium active:scale-[0.99] disabled:opacity-60"
              >
                <span>{g.name}</span>
                <span className="text-[14px] font-normal text-[var(--muted)]">
                  {pending === g.id ? '…' : g.team}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Button variant="secondary" onClick={onCancel}>
        Zurück
      </Button>
    </div>
  );
}
