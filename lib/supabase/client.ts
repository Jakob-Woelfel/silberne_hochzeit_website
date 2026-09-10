'use client';

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/** Browser-Client mit dem Publishable Key (frueher: anon key).
 *  Aktuell nur fuer Realtime auf `session` (Phase 4). */
let cached: ReturnType<typeof createClient<Database>> | null = null;

export function supabaseBrowser() {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Supabase-Env fehlt im Client');

  cached = createClient<Database>(url, key, { auth: { persistSession: false } });
  return cached;
}
