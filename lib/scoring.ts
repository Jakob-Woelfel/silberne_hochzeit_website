import type { AnswerValue, Question } from '@/content/types';
import type { EstimateTiers, Solution } from '@/content/solutionTypes';

/** Reine Logik, kein I/O. Wird unit-getestet (lib/scoring.test.ts). */

export const DEFAULT_ESTIMATE_TIERS: EstimateTiers = [
  { within: 0.05, points: 20 },
  { within: 0.15, points: 15 },
  { within: 0.3, points: 10 },
  { within: 0.5, points: 5 },
];

/** Bingo (Kickoff 4.2, Team-Wertung): Feld, volle Reihe/Spalte, komplettes Grid. */
export const BINGO_FIELD_POINTS = 10;
export const BINGO_LINE_POINTS = 20;
export const BINGO_FULL_POINTS = 50;

export type BingoBonus = { id: string; points: number };

/**
 * Welche Boni stehen einem Gast mit den erledigten Feldern zu?
 * `grid` = Feld-IDs zeilenweise. Bonus-IDs tragen das Präfix `bingo_`, damit die
 * Team-View sie mitzählt, und sind stabil, damit sie nur einmal vergeben werden.
 */
export function bingoBonuses(doneIds: Iterable<string>, grid: string[][]): BingoBonus[] {
  const done = new Set(doneIds);
  const bonuses: BingoBonus[] = [];
  const all = grid.flat();
  if (all.length === 0) return bonuses;

  grid.forEach((row, r) => {
    if (row.length > 0 && row.every((id) => done.has(id))) {
      bonuses.push({ id: `bingo_row_${r + 1}`, points: BINGO_LINE_POINTS });
    }
  });

  const cols = Math.max(...grid.map((row) => row.length));
  for (let c = 0; c < cols; c++) {
    const col = grid.map((row) => row[c]).filter((id): id is string => id !== undefined);
    if (col.length === grid.length && col.every((id) => done.has(id))) {
      bonuses.push({ id: `bingo_col_${c + 1}`, points: BINGO_LINE_POINTS });
    }
  }

  if (all.every((id) => done.has(id))) {
    bonuses.push({ id: 'bingo_full', points: BINGO_FULL_POINTS });
  }
  return bonuses;
}

/** Punkte je Zoomstufe (Kickoff 4.2): Stufe 1 = 30, Stufe 2 = 20, Stufe 3 = 10. */
export const ZOOM_POINTS = [30, 20, 10] as const;

export function normalizeText(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:]+$/g, '');
}

function estimatePoints(
  guess: number,
  correct: number,
  tiers: EstimateTiers = DEFAULT_ESTIMATE_TIERS,
): number {
  if (!Number.isFinite(guess)) return 0;
  const diff = Math.abs(guess - correct);
  // Lösung 0: nur exakter Treffer zählt voll, sonst absolute Nähe unmöglich zu skalieren
  const deviation = correct === 0 ? (diff === 0 ? 0 : Infinity) : diff / Math.abs(correct);
  const sorted = [...tiers].sort((a, b) => a.within - b.within);
  for (const tier of sorted) {
    if (deviation <= tier.within) return tier.points;
  }
  return 0;
}

/**
 * Punkte für eine Antwort. Wirft nie – bei unpassender Antwortform gibt es 0 Punkte,
 * damit ein kaputter Client keinen 500er auslöst.
 */
export function score(
  question: Question,
  solution: Solution,
  value: AnswerValue,
): number {
  if (question.type !== solution.type || value.type !== solution.type) return 0;

  switch (solution.type) {
    case 'choice': {
      const v = value as Extract<AnswerValue, { type: 'choice' }>;
      return normalizeText(v.option) === normalizeText(solution.correct)
        ? (solution.points ?? 10)
        : 0;
    }

    case 'estimate': {
      const v = value as Extract<AnswerValue, { type: 'estimate' }>;
      return estimatePoints(v.number, solution.correct, solution.tiers);
    }

    case 'text': {
      const v = value as Extract<AnswerValue, { type: 'text' }>;
      const given = normalizeText(v.text ?? '');
      if (given.length === 0) return 0;
      return solution.accept.some((a) => normalizeText(a) === given)
        ? (solution.points ?? 10)
        : 0;
    }

    case 'multi': {
      const v = value as Extract<AnswerValue, { type: 'multi' }>;
      const perHit = solution.perHit ?? 5;
      const perMiss = solution.perMiss ?? 5;
      const correct = new Set(solution.correct.map(normalizeText));
      const picked = new Set((v.options ?? []).map(normalizeText));
      let points = 0;
      for (const p of picked) {
        points += correct.has(p) ? perHit : -perMiss;
      }
      return Math.max(0, points);
    }

    case 'order': {
      const v = value as Extract<AnswerValue, { type: 'order' }>;
      const per = solution.perPosition ?? 5;
      const given = v.items ?? [];
      let points = 0;
      solution.correct.forEach((item, i) => {
        if (given[i] !== undefined && normalizeText(given[i]) === normalizeText(item)) {
          points += per;
        }
      });
      return points;
    }

    case 'zoom': {
      // Nur der letzte Tipp zählt, die Stufe ergibt sich aus der Anzahl der Tipps.
      const v = value as Extract<AnswerValue, { type: 'zoom' }>;
      const guesses = v.guesses ?? [];
      const step = guesses.length;
      const last = guesses[step - 1];
      if (last === undefined || normalizeText(last) !== normalizeText(solution.correct)) return 0;
      return ZOOM_POINTS[step - 1] ?? 0;
    }

    case 'age': {
      const v = value as Extract<AnswerValue, { type: 'age' }>;
      const numbers = v.numbers ?? [];
      return solution.correct.reduce(
        (sum, correct, i) => sum + estimatePoints(numbers[i] ?? NaN, correct, solution.tiers),
        0,
      );
    }
  }
}

/**
 * Ist die Antwort endgültig? Zoom-Fragen bleiben offen, bis ein Tipp stimmt
 * oder alle drei Stufen verbraucht sind. Alles andere ist mit dem ersten
 * Speichern erledigt.
 */
export function isFinalAnswer(value: AnswerValue, points: number): boolean {
  if (value.type !== 'zoom') return true;
  return points > 0 || (value.guesses ?? []).length >= ZOOM_POINTS.length;
}

/** Maximal erreichbare Punkte – für Fortschrittsanzeigen. */
export function maxPoints(solution: Solution): number {
  switch (solution.type) {
    case 'choice':
      return solution.points ?? 10;
    case 'text':
      return solution.points ?? 10;
    case 'estimate':
      return Math.max(...(solution.tiers ?? DEFAULT_ESTIMATE_TIERS).map((t) => t.points));
    case 'multi':
      return (solution.perHit ?? 5) * solution.correct.length;
    case 'order':
      return (solution.perPosition ?? 5) * solution.correct.length;
    case 'zoom':
      return ZOOM_POINTS[0];
    case 'age':
      return (
        solution.correct.length *
        Math.max(...(solution.tiers ?? DEFAULT_ESTIMATE_TIERS).map((t) => t.points))
      );
  }
}
