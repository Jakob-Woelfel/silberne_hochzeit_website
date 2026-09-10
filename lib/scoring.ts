import type { AnswerValue, Question } from '@/content/types';
import type { EstimateTiers, Solution } from '@/content/solutionTypes';

/** Reine Logik, kein I/O. Wird unit-getestet (lib/scoring.test.ts). */

export const DEFAULT_ESTIMATE_TIERS: EstimateTiers = [
  { within: 0.05, points: 20 },
  { within: 0.15, points: 15 },
  { within: 0.3, points: 10 },
  { within: 0.5, points: 5 },
];

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
      const v = value as Extract<AnswerValue, { type: 'zoom' }>;
      if (normalizeText(v.option) !== normalizeText(solution.correct)) return 0;
      return { 1: 30, 2: 20, 3: 10 }[v.step] ?? 0;
    }

    case 'age': {
      const v = value as Extract<AnswerValue, { type: 'age' }>;
      const [a, b] = v.numbers ?? [NaN, NaN];
      return (
        estimatePoints(a, solution.correct[0], solution.tiers) +
        estimatePoints(b, solution.correct[1], solution.tiers)
      );
    }
  }
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
      return 30;
    case 'age':
      return 2 * Math.max(...(solution.tiers ?? DEFAULT_ESTIMATE_TIERS).map((t) => t.points));
  }
}
