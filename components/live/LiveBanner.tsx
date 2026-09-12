'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useSessionSignal } from './useSessionSignal';

const POLL_MS = 10_000;

/**
 * Hinweis auf allen Gast-Seiten, sobald die Live-Runde läuft (Kickoff §5).
 * Liest nur die session-Zeile, die für anon ohnehin lesbar ist.
 */
export function LiveBanner({ initialPhase }: { initialPhase: string }) {
  const pathname = usePathname();
  const [phase, setPhase] = useState(initialPhase);

  const refresh = useCallback(async () => {
    try {
      const { data } = await supabaseBrowser().from('session').select('phase').eq('id', 1).maybeSingle();
      if (data?.phase) setPhase(data.phase);
    } catch {
      /* Env fehlt oder offline – Banner bleibt beim letzten Stand */
    }
  }, []);

  useSessionSignal(refresh);
  useEffect(() => {
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const active = phase === 'lobby' || phase === 'question' || phase === 'reveal';
  if (!active || pathname === '/live') return null;

  return (
    <Link
      href="/live"
      className="flex min-h-[56px] items-center justify-between gap-3 bg-[var(--accent)] px-4 text-white"
    >
      <span className="flex items-center gap-2 font-semibold">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
        </span>
        Die Live-Runde läuft
      </span>
      <span className="text-[15px]">Jetzt mitmachen →</span>
    </Link>
  );
}
