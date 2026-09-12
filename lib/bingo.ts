import 'server-only';

import { BINGO_POOL, bingoGridFor } from '@/content/bingo';
import { bingoBonuses, BINGO_FIELD_POINTS } from '@/lib/scoring';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { AnswerValue } from '@/content/types';

export type BingoState = {
  /** Feld-ID -> Storage-Pfad des Selfies */
  done: Record<string, string>;
  /** Punkte des Gastes aus Feldern + Boni */
  points: number;
  /** bereits vergebene Bonus-IDs */
  bonuses: string[];
};

const FIELD_IDS = new Set(BINGO_POOL.map((f) => f.id));

export async function loadBingoState(guestId: string): Promise<BingoState> {
  const { data } = await supabaseAdmin()
    .from('answers')
    .select('task_id, value, points')
    .eq('guest_id', guestId)
    .like('task_id', 'bingo%');

  const state: BingoState = { done: {}, points: 0, bonuses: [] };
  for (const row of (data ?? []) as { task_id: string; value: unknown; points: number }[]) {
    const value = row.value as AnswerValue;
    state.points += row.points;
    if (FIELD_IDS.has(row.task_id) && value?.type === 'bingo') {
      state.done[row.task_id] = value.path;
    } else if (value?.type === 'bingo_bonus') {
      state.bonuses.push(row.task_id);
    }
  }
  return state;
}

/**
 * Feld als erledigt eintragen und fällige Boni vergeben. Idempotent: ein zweiter
 * Upload zum selben Feld ersetzt nur den Pfad, Boni werden nie doppelt vergeben.
 */
export async function completeBingoField(
  guestId: string,
  fieldId: string,
  path: string,
): Promise<{ state: BingoState; newBonuses: string[] }> {
  const db = supabaseAdmin();
  const value: AnswerValue = { type: 'bingo', path };

  const { error } = await db.from('answers').upsert({
    guest_id: guestId,
    task_id: fieldId,
    value,
    points: BINGO_FIELD_POINTS,
  });
  if (error) throw new Error(`bingo upsert failed: ${error.message}`);

  // ein Upload-Eintrag pro Gast und Feld; Re-Upload ersetzt ihn
  await db.from('uploads').delete().eq('guest_id', guestId).eq('task_id', fieldId);
  await db.from('uploads').insert({ guest_id: guestId, task_id: fieldId, storage_path: path });

  const before = await loadBingoState(guestId);
  const due = bingoBonuses(Object.keys(before.done), bingoGridFor(guestId));
  const missing = due.filter((b) => !before.bonuses.includes(b.id));

  if (missing.length > 0) {
    const bonusValue = (id: string): AnswerValue => ({ type: 'bingo_bonus', line: id });
    const { error: bonusError } = await db.from('answers').upsert(
      missing.map((b) => ({
        guest_id: guestId,
        task_id: b.id,
        value: bonusValue(b.id),
        points: b.points,
      })),
      { onConflict: 'guest_id,task_id', ignoreDuplicates: true },
    );
    if (bonusError) console.error('bingo bonus upsert failed', bonusError);
  }

  const state = missing.length > 0 ? await loadBingoState(guestId) : before;
  return { state, newBonuses: missing.map((b) => b.id) };
}
