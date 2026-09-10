'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export function AdminLogin() {
  const router = useRouter();
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', key }),
    });

    if (res.ok) {
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data.error ?? 'Anmeldung fehlgeschlagen.');
    setPending(false);
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-12">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="mt-2 text-[var(--muted)]">
        Zugang mit dem HOST_SECRET aus der Umgebung.
      </p>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <input
          type="password"
          autoComplete="off"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Schlüssel"
          className="min-h-[56px] w-full rounded-xl border border-[var(--border)] bg-white px-4 outline-none focus:border-[var(--accent)]"
        />
        {error && <p className="text-[15px] text-red-700">{error}</p>}
        <Button type="submit" disabled={pending || key.length === 0}>
          {pending ? 'Prüfe …' : 'Anmelden'}
        </Button>
      </form>
      <p className="mt-4 text-[14px] text-[var(--muted)]">
        Alternativ einmalig <code>/admin/enter?key=…</code> aufrufen.
      </p>
    </div>
  );
}
