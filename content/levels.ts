import type { Question } from './types';

/**
 * CLIENT-SAFE. Hier stehen nur Fragen, niemals Lösungen.
 * Lösungen liegen in levels.solutions.ts (server-only).
 *
 * PLATZHALTER: Die Fragen unten sind Beispiele, damit alle Aufgabentypen
 * durchspielbar sind. Jakob ersetzt sie durch die echten Fragen.
 */

export const LEVELS: Record<1 | 2 | 3, { title: string; subtitle: string; questions: Question[] }> = {
  1: {
    title: 'Level 1',
    subtitle: 'Kennenlernen',
    questions: [
      {
        id: 'l1_q1',
        type: 'choice',
        prompt: 'PLATZHALTER: Welche Haarfarbe hatte Katrin an ihrem Hochzeitstag?',
        options: ['Blond', 'Braun', 'Rot', 'Schwarz'],
      },
      {
        id: 'l1_q2',
        type: 'text',
        prompt: 'PLATZHALTER: Wie heißt der Song, zu dem Bernd und Katrin ihren Hochzeitstanz getanzt haben?',
        placeholder: 'Songtitel',
      },
      {
        id: 'l1_q3',
        type: 'estimate',
        prompt: 'PLATZHALTER: Wie viele Gäste waren 2001 auf der Hochzeit?',
        unit: 'Gäste',
        placeholder: 'z. B. 80',
      },
      {
        id: 'l1_q4',
        type: 'multi',
        prompt: 'PLATZHALTER: Welche dieser Dinge standen bei der Hochzeit auf dem Buffet?',
        hint: 'Mehrfachauswahl. Für jeden Treffer gibt es Punkte, für jeden Fehlgriff Abzug.',
        options: ['Kartoffelsalat', 'Sushi', 'Spanferkel', 'Käseigel', 'Tiramisu'],
      },
      {
        id: 'l1_q5',
        type: 'order',
        prompt: 'PLATZHALTER: Bring den Pfingstmontag 2001 in die richtige Reihenfolge.',
        hint: 'Tippe die Ereignisse nacheinander in der richtigen Reihenfolge an.',
        items: ['Standesamt', 'Sektempfang', 'Kirche', 'Hochzeitstanz', 'Torte'],
      },
    ],
  },
  2: {
    title: 'Level 2',
    subtitle: 'Zahlen & Orte',
    questions: [], // Phase 2
  },
  3: {
    title: 'Level 3',
    subtitle: 'Wer ist das?',
    questions: [], // Phase 2
  },
};

export const LEVEL_NUMBERS = [1, 2, 3] as const;
export type LevelNumber = (typeof LEVEL_NUMBERS)[number];

export function isLevelNumber(n: unknown): n is LevelNumber {
  return n === 1 || n === 2 || n === 3;
}

export function levelOf(n: LevelNumber) {
  return LEVELS[n];
}

export function questionById(id: string): Question | undefined {
  for (const n of LEVEL_NUMBERS) {
    const q = LEVELS[n].questions.find((x) => x.id === id);
    if (q) return q;
  }
  return undefined;
}
