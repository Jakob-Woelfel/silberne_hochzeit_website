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
 * - `multi`: echte und falsche Optionen gemischt, welche stimmen steht nur in der Lösung.
 * - `zoom`/`age`: `image` ist die Bild-ID = Dateiname in photos/ ohne Endung.
 *   Danach `npm run photos` laufen lassen (erzeugt public/zoom und public/age).
 */

export const LEVELS: Record<1 | 2 | 3, { title: string; subtitle: string; questions: Question[] }> = {
  1: {
    title: 'Level 1',
    subtitle: 'Die Hochzeit 2001',
    questions: [
      // ── l1_q1 · Katrins Alter ────────────────────────────────────────────
      {
        id: 'l1_q1',
        type: 'choice',
        prompt: 'Wie alt war Katrin bei der Hochzeit?',
        options: ['22', '24', '26', '28'],
      },

      // ── l1_q2 · Kennenlernen ─────────────────────────────────────────────
      {
        id: 'l1_q2',
        type: 'choice',
        prompt: 'Wie haben sich Bernd und Katrin kennengelernt?',
        options: [
          'Im Schwimmverein',
          'Auf einer Hochzeit von Freunden',
          'Im Studium',
          'Beim Skifahren',
        ],
      },

      // ── l1_q3 · Feiertag ─────────────────────────────────────────────────
      {
        id: 'l1_q3',
        type: 'choice',
        prompt: 'An welchem Feiertag haben die beiden geheiratet?',
        options: ['Ostern', 'Pfingsten', 'Fronleichnam', 'Tag der Arbeit'],
      },

      // ── l1_q4 · Haarfarbe ────────────────────────────────────────────────
      {
        id: 'l1_q4',
        type: 'choice',
        prompt: 'Welche Haarfarbe hatte Bernd an seinem Hochzeitstag?',
        options: ['Blond', 'Braun', 'Schwarz', 'Grau meliert'],
      },

      // ── l1_q6 · Gästezahl ────────────────────────────────────────────────
      {
        id: 'l1_q6',
        type: 'estimate',
        prompt: 'Wie viele Gäste waren 2001 bei der Hochzeit?',
        hint: 'Je näher dran, desto mehr Punkte.',
        unit: 'Gäste',
        placeholder: 'z. B. 80',
      },

      // ── l1_q7 · Hochzeitsreise ───────────────────────────────────────────
      {
        id: 'l1_q7',
        type: 'choice',
        prompt: 'Wohin ging die Hochzeitsreise?',
        options: ['Mallorca', 'Australien', 'Kanada', 'Thailand'],
      },

      // ── l1_q8 · Ort der Hochzeit ─────────────────────────────────────────
      {
        id: 'l1_q8',
        type: 'choice',
        prompt: 'Wo wurde 2001 geheiratet?',
        options: [
          'Standesamt Darmstadt',
          'Kirche in Eberstadt',
          'Freie Trauung im Garten',
          'Standesamt Hamburg',
        ],
      },

      // ── l1_q9 · Erstes Auto ──────────────────────────────────────────────
      {
        id: 'l1_q9',
        type: 'choice',
        prompt: 'Was war 2001 das erste gemeinsame Auto der beiden?',
        options: ['VW Golf', 'Opel Corsa', 'Ford Fiesta', 'Renault Twingo'],
      },

      // ── l1_q10 · Erste Wohnung ───────────────────────────────────────────
      {
        id: 'l1_q10',
        type: 'estimate',
        prompt: 'Wie viele Quadratmeter hatte die erste gemeinsame Wohnung?',
        hint: 'Je näher dran, desto mehr Punkte.',
        unit: 'm²',
        placeholder: 'z. B. 60',
      },
    ],
  },
  2: {
    title: 'Level 2',
    subtitle: 'Zahlen & Orte',
    questions: [
      // ── l2_q2 · Wohnorte ─────────────────────────────────────────────────
      {
        id: 'l2_q2',
        type: 'multi',
        prompt: 'In welchen Orten haben Bernd und Katrin zusammen gewohnt?',
        hint: 'Mehrfachauswahl. Jeder Treffer bringt Punkte, jeder Fehlgriff kostet welche.',
        options: [
          'Berlin',
          'Darmstadt',
          'Heidelberg',
          'Hamburg',
          'Mainz',
          'Ebersheim',
          'Würzburg',
          'Bulgarien',
          'Frankfurt',
        ],
      },

      // ── l2_q3 · Umzüge ───────────────────────────────────────────────────
      {
        id: 'l2_q3',
        type: 'estimate',
        prompt: 'Wie oft sind die beiden zusammen umgezogen?',
        hint: 'Gezählt wird jeder gemeinsame Umzug seit dem Zusammenziehen.',
        unit: 'Umzüge',
        placeholder: 'z. B. 3',
      },

      // ── l2_q4 · Ehe-Tage ─────────────────────────────────────────────────
      // Lösung rechnet levels.solutions.ts aus dem Hochzeitsdatum aus.
      {
        id: 'l2_q4',
        type: 'estimate',
        prompt: 'Wie viele Tage sind Bernd und Katrin heute verheiratet?',
        hint: 'Vom Hochzeitstag bis heute, ohne Taschenrechner.',
        unit: 'Tage',
        placeholder: 'z. B. 9000',
      },

      // ── l2_q5 · Geburtstage ──────────────────────────────────────────────
      // Lösung rechnet levels.solutions.ts aus dem Kennenlern-Jahr aus.
      {
        id: 'l2_q5',
        type: 'estimate',
        prompt: 'Wie viele Geburtstage haben die beiden seit ihrem Kennenlernen zusammen gefeiert?',
        hint: 'Nur die eigenen Geburtstage, beide zusammengezählt.',
        unit: 'Geburtstage',
        placeholder: 'z. B. 40',
      },

      // ── l2_q6 · Länder ───────────────────────────────────────────────────
      {
        id: 'l2_q6',
        type: 'estimate',
        prompt: 'Wie viele Länder haben die beiden gemeinsam bereist?',
        hint: 'Deutschland zählt nicht mit.',
        unit: 'Länder',
        placeholder: 'z. B. 12',
      },
    ],
  },
  3: {
    title: 'Level 3',
    subtitle: 'Wer ist das?',
    questions: [
      // ── l3_q1 · Zoom 1 ───────────────────────────────────────────────────
      {
        id: 'l3_q1',
        type: 'zoom',
        prompt: 'Wer ist das?',
        hint: 'Drei Stufen, pro Stufe ein Tipp. Je früher du richtig liegst, desto mehr Punkte.',
        image: 'zoom1',
        options: ['Maria', 'Katrin', 'Petra', 'Bernd'],
      },

      // ── l3_q2 · Zoom 2 ───────────────────────────────────────────────────
      {
        id: 'l3_q2',
        type: 'zoom',
        prompt: 'Wer ist das?',
        hint: 'Drei Stufen, pro Stufe ein Tipp. Je früher du richtig liegst, desto mehr Punkte.',
        image: 'zoom2',
        options: ['Jakob', 'Bernd', 'Klaus', 'Katrin'],
      },

      // ── l3_q4 · Alter 1 ──────────────────────────────────────────────────
      {
        id: 'l3_q4',
        type: 'age',
        prompt: 'Wie alt ist Bernd auf diesem Foto?',
        image: 'age1',
        people: ['Bernd'],
      },

      // ── l3_q5 · Alter 2 ──────────────────────────────────────────────────
      {
        id: 'l3_q5',
        type: 'age',
        prompt: 'Wie alt sind die beiden auf diesem Foto?',
        image: 'age2',
        people: ['Bernd', 'Katrin'],
      },

      // ── l3_q6 · Alter 3 ──────────────────────────────────────────────────
      {
        id: 'l3_q6',
        type: 'age',
        prompt: 'Wie alt sind die beiden auf diesem Foto?',
        image: 'age3',
        people: ['Bernd', 'Katrin'],
      },

      // ── l3_q7 · Alter 4 ──────────────────────────────────────────────────
      {
        id: 'l3_q7',
        type: 'age',
        prompt: 'Wie alt sind die beiden auf diesem Foto?',
        image: 'age4',
        people: ['Bernd', 'Katrin'],
      },
    ],
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
