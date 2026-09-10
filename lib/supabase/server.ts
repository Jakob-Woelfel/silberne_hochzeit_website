import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Service-Role-Client. Umgeht RLS – darf nur in Server Components,
 * Route Handlers und Server Actions verwendet werden.
 */
let cached: ReturnType<typeof createClient<Database>> | null = null;

export function supabaseAdmin() {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase ist nicht konfiguriert: NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY fehlen in .env.local',
    );
  }

  cached = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** true, wenn die Env-Variablen gesetzt sind – für freundliche Fehlerseiten. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
