import 'server-only';

import type { EstimateTiers, Solution } from './solutionTypes';
import { EVENT_DATE } from './schedule';

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
 * - `multi`: `correct` = nur die richtigen Optionen, zeichengleich zu levels.ts.
 * - `zoom`: `correct` = der richtige Name aus den Optionen.
 * - `age`: ein Alter je Person, gleiche Reihenfolge wie `people` in levels.ts.
 * - Offene Stellen heißen `TODO …`; `npm test` meldet Tippfehler nach dem Eintragen.
 */

// ── Eckdaten, aus denen Level 2 rechnet ────────────────────────────────────
// Standesamt Darmstadt 01.06.2001 (kirchlich Pfingstsonntag 03.06.2001).
// Für die Ehe-Tage zählt der standesamtliche Termin.
const WEDDING_DATE = '2001-06-01';
// Kennenlernen im Schwimmverein.
const MET_YEAR = 1995;

const EVENT_YEAR = Number(EVENT_DATE.slice(0, 4));

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000);
}

/**
 * Alters-Staffel: halbe Punkte gegenüber den Schätzfragen, damit fünf Fotos
 * mit bis zu zwei Personen nicht das ganze Ranking dominieren (max. 10 P je Person).
 */
const AGE_TIERS: EstimateTiers = [
  { within: 0.05, points: 10 },
  { within: 0.15, points: 7 },
  { within: 0.3, points: 4 },
  { within: 0.5, points: 2 },
];

export const SOLUTIONS: Record<string, Solution> = {
  // ── l1_q2 · Kennenlernen ───────────────────────────────────────────────
  l1_q2: { type: 'choice', correct: 'Im Schwimmverein' },

  // ── l1_q3 · Feiertag ───────────────────────────────────────────────────
  l1_q3: { type: 'choice', correct: 'Pfingsten' },

  // ── l1_q4 · Haarfarbe ──────────────────────────────────────────────────
  l1_q4: { type: 'choice', correct: 'Schwarz' },

  // ── l1_q6 · Gästezahl ──────────────────────────────────────────────────
  l1_q6: { type: 'estimate', correct: 90 },

  // ── l1_q7 · Hochzeitsreise ─────────────────────────────────────────────
  l1_q7: { type: 'choice', correct: 'Australien' },

  // ── l1_q8 · Ort der Hochzeit ───────────────────────────────────────────
  l1_q8: { type: 'choice', correct: 'Standesamt Darmstadt' },

  // ── l1_q9 · Erstes Auto ────────────────────────────────────────────────
  l1_q9: { type: 'choice', correct: 'VW Golf' }, // der rote

  // ── l1_q10 · Erste Wohnung ─────────────────────────────────────────────
  l1_q10: { type: 'estimate', correct: 63 },

  // ── l2_q2 · Wohnorte ───────────────────────────────────────────────────
  // Reihenfolge der Stationen: Darmstadt → Ebersheim → Darmstadt → Bulgarien → Darmstadt → Hamburg
  l2_q2: { type: 'multi', correct: ['Darmstadt', 'Ebersheim', 'Bulgarien', 'Hamburg'] },

  // ── l2_q3 · Umzüge ─────────────────────────────────────────────────────
  l2_q3: { type: 'estimate', correct: 6 },

  // ── l2_q4 · Ehe-Tage ───────────────────────────────────────────────────
  // rechnet sich aus WEDDING_DATE oben
  l2_q4: { type: 'estimate', correct: daysBetween(WEDDING_DATE, EVENT_DATE) },

  // ── l2_q5 · Geburtstage ────────────────────────────────────────────────
  // rechnet sich aus MET_YEAR oben: beide Personen, ein Geburtstag pro Jahr seit dem Kennenlernen
  l2_q5: { type: 'estimate', correct: 2 * (EVENT_YEAR - MET_YEAR) },

  // ── l2_q6 · Länder ─────────────────────────────────────────────────────
  l2_q6: { type: 'estimate', correct: 18 },

  // ── l3_q1 · Zoom 1 ─────────────────────────────────────────────────────
  l3_q1: { type: 'zoom', correct: 'Katrin' },

  // ── l3_q2 · Zoom 2 ─────────────────────────────────────────────────────
  l3_q2: { type: 'zoom', correct: 'Bernd' },

  // ── l3_q3 · Zoom 3 ─────────────────────────────────────────────────────
  l3_q3: { type: 'zoom', correct: 'Katrin' },

  // ── l3_q4 · Alter 1 ────────────────────────────────────────────────────
  l3_q4: { type: 'age', correct: [17], tiers: AGE_TIERS },

  // ── l3_q5 · Alter 2 ────────────────────────────────────────────────────
  l3_q5: { type: 'age', correct: [25, 19], tiers: AGE_TIERS },

  // ── l3_q6 · Alter 3 ────────────────────────────────────────────────────
  l3_q6: { type: 'age', correct: [26, 20], tiers: AGE_TIERS },

  // ── l3_q7 · Alter 4 ────────────────────────────────────────────────────
  l3_q7: { type: 'age', correct: [46, 40], tiers: AGE_TIERS },

  // ── l3_q8 · Alter 5 ────────────────────────────────────────────────────
  l3_q8: { type: 'age', correct: [6], tiers: AGE_TIERS },
};

export function solutionFor(taskId: string): Solution | undefined {
  return SOLUTIONS[taskId];
}
