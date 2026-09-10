import 'server-only';

import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { Guest, SoloRankingRow } from '@/lib/supabase/types';

export const GUEST_COOKIE = 'guest_id';
export const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function getGuestId(): Promise<string | null> {
  const store = await cookies();
  return store.get(GUEST_COOKIE)?.value ?? null;
}

export async function getGuest(): Promise<Guest | null> {
  const id = await getGuestId();
  if (!id) return null;

  const { data, error } = await supabaseAdmin()
    .from('guests')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as Guest;
}

export type GuestStanding = {
  guest: Guest;
  points: number;
  rank: number;
  totalGuests: number;
};

/** Eigener Solo-Score plus Rang. Solo-Ränge anderer Gäste werden nie ausgeliefert. */
export async function getStanding(guest: Guest): Promise<GuestStanding> {
  const db = supabaseAdmin();

  const [{ data: row }, { count }] = await Promise.all([
    db.from('solo_ranking').select('*').eq('id', guest.id).maybeSingle(),
    db.from('guests').select('id', { count: 'exact', head: true }),
  ]);

  const solo = row as unknown as SoloRankingRow | null;
  return {
    guest,
    points: solo?.points ?? 0,
    rank: solo?.rank ?? 1,
    totalGuests: count ?? 1,
  };
}

export type StoredAnswer = { value: unknown; points: number };

/**
 * Alle Antworten eines Gasts als Map task_id -> { value, points }.
 * Pro Gast sind das hoechstens ein paar Dutzend Zeilen, daher immer alle auf einmal.
 */
export async function getAllAnswers(
  guestId: string,
): Promise<Record<string, StoredAnswer>> {
  const { data, error } = await supabaseAdmin()
    .from('answers')
    .select('task_id, value, points')
    .eq('guest_id', guestId);

  if (error || !data) return {};

  const map: Record<string, StoredAnswer> = {};
  for (const row of data as unknown as { task_id: string; value: unknown; points: number }[]) {
    map[row.task_id] = { value: row.value, points: row.points };
  }
  return map;
}

/**
 * Antworten zu einem Praefix, z. B. 'l1_'.
 * Der Praefix muss den Unterstrich enthalten: 'l' wuerde auch 'live_q1' treffen.
 */
export async function getAnswersForPrefix(
  guestId: string,
  prefix: string,
): Promise<Record<string, StoredAnswer>> {
  const all = await getAllAnswers(guestId);
  const map: Record<string, StoredAnswer> = {};
  for (const [taskId, row] of Object.entries(all)) {
    if (taskId.startsWith(prefix)) map[taskId] = row;
  }
  return map;
}
