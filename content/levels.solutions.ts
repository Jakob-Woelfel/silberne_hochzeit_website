import 'server-only';

import type { Solution } from './solutionTypes';

/**
 * NUR SERVER. Diese Datei darf niemals aus einer Client Component importiert werden –
 * `server-only` bricht den Build, falls es doch passiert.
 *
 * Eintragen der Lösungen (Jakob):
 * - Die Blöcke „── l1_qN · Thema ──“ entsprechen 1:1 denen in levels.ts.
 * - `correct` bei `choice` muss ZEICHENGLEICH zu einer Option in levels.ts sein
 *   (Groß/Kleinschreibung egal, alles andere exakt).
 * - `correct` bei `order` enthält dieselben Items wie levels.ts, nur in der
 *   richtigen Reihenfolge.
 * - `estimate`: einfach die Zahl. Punkte: ±5 % → 20, ±15 % → 15, ±30 % → 10, ±50 % → 5.
 * - Offene Stellen heißen `TODO …`; `npm test` meldet Tippfehler nach dem Eintragen.
 */

export const SOLUTIONS: Record<string, Solution> = {
  // ── l1_q1 · Wer ist älter ──────────────────────────────────────────────
  // TODO(Jakob): 'Bernd' oder 'Katrin'
  l1_q1: { type: 'choice', correct: 'TODO' },

  // ── l1_q2 · Kennenlernen ───────────────────────────────────────────────
  // TODO(Jakob): exakt die richtige Option aus levels.ts
  l1_q2: { type: 'choice', correct: 'TODO richtig' },

  // ── l1_q3 · Feiertag ───────────────────────────────────────────────────
  l1_q3: { type: 'choice', correct: 'Pfingsten' },

  // ── l1_q4 · Haarfarbe ──────────────────────────────────────────────────
  // TODO(Jakob): 'Blond' | 'Braun' | 'Schwarz' | 'Grau meliert'
  l1_q4: { type: 'choice', correct: 'TODO' },

  // ── l1_q5 · Hochzeitssong ──────────────────────────────────────────────
  // TODO(Jakob): exakt die richtige Option aus levels.ts
  l1_q5: { type: 'choice', correct: 'TODO richtig' },

  // ── l1_q6 · Gästezahl ──────────────────────────────────────────────────
  // TODO(Jakob): echte Gästezahl statt 0 eintragen
  l1_q6: { type: 'estimate', correct: 0 },

  // ── l1_q7 · Hochzeitsreise ─────────────────────────────────────────────
  l1_q7: { type: 'choice', correct: 'Australien' },

  // ── l1_q8 · Ablauf des Hochzeitstags ───────────────────────────────────
  // TODO(Jakob): dieselben Stationen wie in levels.ts, in der richtigen Reihenfolge
  l1_q8: {
    type: 'order',
    correct: ['TODO Station A', 'TODO Station B', 'TODO Station C', 'TODO Station D', 'TODO Station E'],
    perPosition: 5,
  },
};

export function solutionFor(taskId: string): Solution | undefined {
  return SOLUTIONS[taskId];
}
