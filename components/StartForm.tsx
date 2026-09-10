'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { persistGuestId, restoreCookieFromLocalStorage } from '@/lib/guestClient';

type Team = { id: number; name: string; color: string };

export function StartForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [team, setTeam] = useState<Team | null>(null);

  // Cookie verloren, localStorage noch da (z. B. nach Browser-Neustart)
  useEffect(() => {
    if (restoreCookieFromLocalStorage()) router.replace('/home');
  }, [router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setError(null);

    try {
      const res = await fetch('/api/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Das hat nicht geklappt.');
        setPending(false);
        return;
      }

      persistGuestId(data.id);
      setTeam(data.team);
    } catch {
      setError('Keine Verbindung. Bitte noch einmal versuchen.');
      setPending(false);
    }
  }

  if (team) {
    return (
      <div className="mt-8">
        <div
          className="rounded-2xl border p-6 text-center"
          style={{ borderColor: team.color, backgroundColor: `${team.color}14` }}
        >
          <p className="text-[var(--muted)]">Du spielst für</p>
          <p className="mt-1 text-2xl font-semibold" style={{ color: team.color }}>
            {team.name}
          </p>
        </div>
        <div className="mt-6">
          <Button onClick={() => router.replace('/home')}>Los geht&rsquo;s</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
      <label htmlFor="name" className="font-medium">
        Dein Name
      </label>
      <input
        id="name"
        name="name"
        type="text"
        autoComplete="given-name"
        enterKeyHint="go"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Vorname reicht"
        maxLength={40}
        className="min-h-[56px] w-full rounded-xl border border-[var(--border)] bg-white px-4 outline-none focus:border-[var(--accent)]"
      />
      {error && <p className="text-[15px] text-red-700">{error}</p>}
      <Button type="submit" disabled={pending || name.trim().length < 2}>
        {pending ? 'Einen Moment …' : 'Mitspielen'}
      </Button>
      <p className="text-[14px] text-[var(--muted)]">
        Kein Passwort, keine Anmeldung. Dein Name ist nur für die Anzeige.
      </p>
    </form>
  );
}
