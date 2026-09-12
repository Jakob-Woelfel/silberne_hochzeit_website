'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ScreenPayload } from '@/app/api/live/screen/route';
import { useSessionSignal } from './useSessionSignal';
import { useNow } from './useNow';

/**
 * Zustand für Beamer und Host-Panel: Realtime-Signal plus Polling, damit
 * auch Antwortzähler und Verteilungen ohne Klick nachlaufen.
 */
export function useScreenState(initial: ScreenPayload, key: string | null, pollMs = 1500) {
  const [state, setState] = useState<ScreenPayload>(initial);
  const [offset, setOffset] = useState(() => initial.serverNow - Date.now());
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const url = key ? `/api/live/screen?key=${encodeURIComponent(key)}` : '/api/live/screen';
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        setError(res.status === 401 ? 'Kein Zugang – Admin-Sitzung abgelaufen?' : `Fehler ${res.status}`);
        return;
      }
      const data = (await res.json()) as ScreenPayload;
      setOffset(data.serverNow - Date.now());
      setState(data);
      setError(null);
    } catch {
      setError('Keine Verbindung.');
    }
  }, [key]);

  useSessionSignal(refresh);
  useEffect(() => {
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  return { state, offset, error, refresh };
}

/** Restsekunden bis `deadline`, mit Serverzeit-Offset. */
export function useSecondsLeft(deadline: number | null, offset: number): number | null {
  const now = useNow(deadline !== null);
  if (deadline === null) return null;
  return Math.max(0, Math.ceil((deadline - (now + offset)) / 1000));
}
