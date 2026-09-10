'use client';

import { useEffect, useState } from 'react';
import { formatDuration, serverNow, syncServerTime } from '@/lib/time';

/** Countdown auf einen Zeitpunkt, korrigiert um den Serverzeit-Offset. */
export function Countdown({
  target,
  onDone,
  className = '',
}: {
  target: number;
  onDone?: () => void;
  className?: string;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval>;

    const tick = () => {
      if (!active) return;
      const left = target - serverNow();
      setRemaining(left);
      if (left <= 0) {
        clearInterval(timer);
        onDone?.();
      }
    };

    syncServerTime().then(() => {
      tick();
      timer = setInterval(tick, 1000);
    });

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [target, onDone]);

  if (remaining === null) {
    return <span className={`tabular-nums text-[var(--muted)] ${className}`}>–:–</span>;
  }

  return (
    <span className={`tabular-nums ${className}`}>{formatDuration(remaining)}</span>
  );
}
