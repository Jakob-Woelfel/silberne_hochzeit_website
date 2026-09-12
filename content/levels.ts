import type { Question } from './types';

/**
 * CLIENT-SAFE. Hier stehen nur Fragen, niemals Lösungen.
 * Lösungen liegen in levels.solutions.ts (server-only).
 *
 * Eintragen der Inhalte (Jakob):
 * - Jede Frage hat einen Kommentarblock „── l1_qN · Thema ──“. Denselben Block
 *   gibt es in levels.solutions.ts – dort steht die passende Lösung.
 * - Offene Stellen heißen `TODO …`. `grep -n TODO content/levels*.ts` zeigt,
 *   was noch fehlt. `npm test` prüft danach, dass Frage und Lösung zusammenpassen.
 * - `choice`: 2–4 Optionen, genau eine ist richtig.
 * - `order`: Items hier in NEUTRALER Reihenfolge (nicht der richtigen!),
 *   die richtige Reihenfolge steht nur in der Lösung.
 */

export const LEVELS: Record<1 | 2 | 3, { title: string; subtitle: string; questions: Question[] }> = {
  1: {
    title: 'Level 1',
    subtitle: 'Die Hochzeit 2001',
    questions: [
      // ── l1_q1 · Wer ist älter ────────────────────────────────────────────
      {
        id: 'l1_q1',
        type: 'choice',
        prompt: 'Wer von beiden ist älter?',
        options: ['Bernd', 'Katrin'],
      },

      // ── l1_q2 · Kennenlernen ─────────────────────────────────────────────
      // TODO(Jakob): richtige Option + 3 Ablenker eintragen, z. B.
      //   'Über Freunde', 'In der Disco', 'Bei der Arbeit', 'Im Urlaub'
      {
        id: 'l1_q2',
        type: 'choice',
        prompt: 'Wie haben sich Bernd und Katrin kennengelernt?',
        options: ['TODO richtig', 'TODO Ablenker 1', 'TODO Ablenker 2', 'TODO Ablenker 3'],
      },

      // ── l1_q3 · Feiertag ─────────────────────────────────────────────────
      {
        id: 'l1_q3',
        type: 'choice',
        prompt: 'An welchem Feiertag haben die beiden geheiratet?',
        options: ['Ostern', 'Pfingsten', 'Fronleichnam', 'Tag der Arbeit'],
      },

      // ── l1_q4 · Haarfarbe ────────────────────────────────────────────────
      // Optionen sind fertig; nur die Lösung fehlt (levels.solutions.ts).
      {
        id: 'l1_q4',
        type: 'choice',
        prompt: 'Welche Haarfarbe hatte Bernd an seinem Hochzeitstag?',
        options: ['Blond', 'Braun', 'Schwarz', 'Grau meliert'],
      },

      // ── l1_q5 · Hochzeitssong ────────────────────────────────────────────
      // TODO(Jakob): richtigen Song + 3 Songs aus der Zeit als Ablenker, z. B.
      //   'Wonderful Tonight – Eric Clapton', 'Angels – Robbie Williams',
      //   'I Don’t Want to Miss a Thing – Aerosmith', 'Perfect Day – Lou Reed'
      {
        id: 'l1_q5',
        type: 'choice',
        prompt: 'Zu welchem Song haben die beiden ihren Hochzeitstanz getanzt?',
        options: ['TODO richtig', 'TODO Ablenker 1', 'TODO Ablenker 2', 'TODO Ablenker 3'],
      },

      // ── l1_q6 · Gästezahl ────────────────────────────────────────────────
      // Frage ist fertig; nur die Zahl fehlt (levels.solutions.ts).
      {
        id: 'l1_q6',
        type: 'estimate',
        prompt: 'Wie viele Gäste waren 2001 bei der Hochzeit?',
        hint: 'Je näher dran, desto mehr Punkte.',
        unit: 'Gäste',
        placeholder: 'z. B. 80',
      },

      // ── l1_q7 · Hochzeitsreise ───────────────────────────────────────────
      // Lösung: Australien. Ablenker dürfen getauscht werden.
      {
        id: 'l1_q7',
        type: 'choice',
        prompt: 'Wohin ging die Hochzeitsreise?',
        options: ['Mallorca', 'Australien', 'Kanada', 'Thailand'],
      },

      // ── l1_q8 · Ablauf des Hochzeitstags ─────────────────────────────────
      // TODO(Jakob): 5–6 Stationen des Hochzeitstags eintragen – hier in
      //   NEUTRALER Reihenfolge (z. B. alphabetisch). Die richtige Reihenfolge
      //   kommt nur in levels.solutions.ts.
      {
        id: 'l1_q8',
        type: 'order',
        prompt: 'Bring den Hochzeitstag 2001 in die richtige Reihenfolge.',
        hint: 'Tippe die Stationen nacheinander in der richtigen Reihenfolge an.',
        items: ['TODO Station A', 'TODO Station B', 'TODO Station C', 'TODO Station D', 'TODO Station E'],
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
