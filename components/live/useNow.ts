'use client';

import { useEffect, useState } from 'react';

/** Tickende lokale Uhr, solange `active`. Rest-/Countdown-Werte werden daraus abgeleitet. */
export function useNow(active: boolean, intervalMs = 200): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);
  return now;
}
