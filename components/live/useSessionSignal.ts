'use client';

import { useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

/**
 * Ruft `onChange` auf, sobald sich die session-Zeile ändert (Supabase Realtime).
 * Läuft ohne Websocket einfach ins Leere – das Polling der Aufrufer fängt das ab.
 */
export function useSessionSignal(onChange: () => void) {
  useEffect(() => {
    let client: ReturnType<typeof supabaseBrowser>;
    try {
      client = supabaseBrowser();
    } catch {
      return;
    }
    const channel = client
      .channel('session-live')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'session' },
        () => onChange(),
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [onChange]);
}
