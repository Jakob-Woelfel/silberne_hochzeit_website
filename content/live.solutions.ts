import 'server-only';

import type { Parent } from './live';

/**
 * NUR SERVER. Wer hat welches Zitat geschrieben, und was antworten die Eltern
 * voraussichtlich bei „Wer würde eher…“.
 *
 * - `quote`: die richtige Antwort, fest.
 * - `either`: Voreinstellung. Beim Auflösen übernimmt der Host sie automatisch
 *   und kann sie auf der Bühne jederzeit überschreiben, falls die Eltern live
 *   etwas anderes sagen.
 */
export const LIVE_SOLUTIONS: Record<string, Parent> = {
  // ── Zitate ───────────────────────────────────────────────────────────────
  live_q1: 'Bernd', // Keine Macht den Drogen
  live_q2: 'Katrin', // noch zwei Mails
  live_q3: 'Bernd', // jede Beziehungskrise
  live_q4: 'Bernd', // Matcha Latte
  live_q5: 'Katrin', // Ikkimel
  live_q6: 'Katrin', // Sachen-Sammel-Nachbar

  // ── Wer würde eher … ─────────────────────────────────────────────────────
  live_q7: 'Bernd', // letztes Stück Kuchen
  live_q8: 'Bernd', // Schlüssel suchen
  live_q9: 'Katrin', // als Letzte nach Hause
  live_q11: 'Katrin', // Shampoo-Flaschen
  live_q12: 'Bernd', // Kühlschrank plündern
  live_q13: 'Katrin', // falsche Gruppe
  live_q14: 'Katrin', // Witz, den niemand versteht
  live_q15: 'Bernd', // Navi ignorieren
};

export function liveSolutionFor(id: string): Parent | undefined {
  return LIVE_SOLUTIONS[id];
}
