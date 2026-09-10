import 'server-only';

import type { Solution } from './solutionTypes';

/**
 * NUR SERVER. Diese Datei darf niemals aus einer Client Component importiert werden –
 * `server-only` bricht den Build, falls es doch passiert.
 *
 * PLATZHALTER – passend zu den Beispielfragen in levels.ts.
 */

export const SOLUTIONS: Record<string, Solution> = {
  l1_q1: { type: 'choice', correct: 'Blond' },
  l1_q2: { type: 'text', accept: ['Wonderful Tonight', 'Wonderful tonight'] },
  l1_q3: { type: 'estimate', correct: 84 },
  l1_q4: { type: 'multi', correct: ['Kartoffelsalat', 'Spanferkel', 'Käseigel'] },
  l1_q5: {
    type: 'order',
    correct: ['Standesamt', 'Kirche', 'Sektempfang', 'Hochzeitstanz', 'Torte'],
  },
};

export function solutionFor(taskId: string): Solution | undefined {
  return SOLUTIONS[taskId];
}
