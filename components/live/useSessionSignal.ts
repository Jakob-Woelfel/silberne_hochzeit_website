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
    // Eindeutiger Name: `channel(name)` liefert sonst einen bereits abonnierten
    // Kanal zurück (StrictMode, zweiter Hook auf derselben Seite) und `.on()`
    // nach `subscribe()` wirft.
    const channel = client
      .channel(`session-${Math.random().toString(36).slice(2)}`)
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
