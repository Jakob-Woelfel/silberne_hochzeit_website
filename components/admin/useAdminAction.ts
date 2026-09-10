'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** Ruft /api/admin auf und laedt die Serverdaten neu. */
export function useAdminAction() {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(
    label: string,
    body: Record<string, unknown>,
    options: { redirectTo?: string } = {},
  ) {
    setPending(label);
    setError(null);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Aktion fehlgeschlagen.');
        return false;
      }
      if (options.redirectTo) window.location.href = options.redirectTo;
      else router.refresh();
      return true;
    } catch {
      setError('Keine Verbindung.');
      return false;
    } finally {
      setPending(null);
    }
  }

  return { run, pending, error };
}
