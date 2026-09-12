/**
 * CLIENT-SAFE. Live-Session am Abend (Kickoff 4.4). Hier stehen nur die
 * Fragen – wer ein Zitat geschrieben hat und was die Eltern bei „Wer würde
 * eher…“ sagen, liegt in live.solutions.ts (server-only).
 *
 * Ablauf: der Host startet Frage für Frage in dieser Reihenfolge, kann aber
 * jede Frage überspringen oder direkt anspringen.
 */

export const PARENTS = ['Bernd', 'Katrin'] as const;
export type Parent = (typeof PARENTS)[number];

/** Antwortzeit pro Frage in Sekunden. Die Zitate stehen auch auf dem Beamer. */
export const LIVE_SECONDS = 20;
/** Serverseitige Toleranz für langsame Verbindungen. */
export const LIVE_GRACE_MS = 2000;

/** Team-Bonus auf den Team-Score, nach Platz in der Live-Wertung (1., 2., 3.). */
export const LIVE_BONUS = [300, 200, 100] as const;

/** Punkte pro Gast: richtig = 100, plus bis zu 50 Tempobonus (Zitate). */
export const LIVE_BASE_POINTS = 100;
export const LIVE_SPEED_BONUS = 50;

export const QUOTE_HEADING = 'Wer hat das geschrieben?';
export const EITHER_HEADING = 'Wer würde eher …';

export type LiveQuestion =
  | {
      id: string;
      type: 'quote';
      /** das Zitat, wörtlich aus dem Chat */
      prompt: string;
      options: string[];
    }
  | {
      id: string;
      type: 'either';
      /** Satzende nach „Wer würde eher …“ */
      prompt: string;
      options: string[];
    }
  | {
      id: string;
      type: 'menti';
      prompt: string;
      placeholder?: string;
    };

const parents = () => [...PARENTS];

export const LIVE_QUESTIONS: LiveQuestion[] = [
  // ── Zitate: Bernd oder Katrin? ───────────────────────────────────────────
  {
    id: 'live_q1',
    type: 'quote',
    prompt: 'Keine Macht den Drogen 🤣',
    options: parents(),
  },
  {
    id: 'live_q2',
    type: 'quote',
    prompt: 'Mmmh, noch zwei Mails!!! Ich komme',
    options: parents(),
  },
  {
    id: 'live_q3',
    type: 'quote',
    prompt: 'Ich will jede Beziehungskrise genau wissen 😂',
    options: parents(),
  },
  {
    id: 'live_q4',
    type: 'quote',
    prompt: 'Hi Maria, bringe ich mit und wir machen uns eine Matcha Latte 😋',
    options: parents(),
  },
  {
    id: 'live_q5',
    type: 'quote',
    prompt: 'Ich war im Fitnessstudio und habe zu Ikkimel geturnt – unterhaltsam 😂',
    options: parents(),
  },
  {
    id: 'live_q6',
    type: 'quote',
    prompt:
      'Wieder was gelernt, diesmal von unserem Sachen-Sammel-Nachbarn: es gibt Leute, die können keine Uhren tragen, die gehen nämlich immer aus, wenn die die am Handgelenk haben. 🤣🤪🙈',
    options: parents(),
  },

  // ── Wer würde eher … ─────────────────────────────────────────────────────
  {
    id: 'live_q7',
    type: 'either',
    prompt: '… heimlich das letzte Stück Kuchen essen?',
    options: parents(),
  },
  {
    id: 'live_q8',
    type: 'either',
    prompt: '… stundenlang nach den Schlüsseln suchen?',
    options: parents(),
  },
  {
    id: 'live_q9',
    type: 'either',
    prompt: '… auf einer Party als Letzte:r nach Hause gehen?',
    options: parents(),
  },
  {
    id: 'live_q11',
    type: 'either',
    prompt: '… im Hotel die kleinen Shampoo-Flaschen mitnehmen?',
    options: parents(),
  },
  {
    id: 'live_q12',
    type: 'either',
    prompt: '… mitten in der Nacht den Kühlschrank plündern?',
    options: parents(),
  },
  {
    id: 'live_q13',
    type: 'either',
    prompt: '… aus Versehen eine Nachricht an die falsche Person oder Gruppe schicken?',
    options: parents(),
  },
  {
    id: 'live_q14',
    type: 'either',
    prompt: '… über einen Witz lachen, den sonst niemand verstanden hat?',
    options: parents(),
  },
  {
    id: 'live_q15',
    type: 'either',
    prompt: '… alle Navigationssysteme ignorieren und trotzdem am Ziel ankommen?',
    options: parents(),
  },

  // Menti-Fragen (Freitext, Wortwolke auf dem Beamer) sind technisch weiter
  // möglich – aktuell bewusst keine im Ablauf.
];

export function liveQuestionById(id: string | null | undefined): LiveQuestion | undefined {
  if (!id) return undefined;
  return LIVE_QUESTIONS.find((q) => q.id === id);
}

export function liveQuestionIndex(id: string | null | undefined): number {
  if (!id) return -1;
  return LIVE_QUESTIONS.findIndex((q) => q.id === id);
}

/** Überschrift über der Frage, je nach Typ. */
export function liveHeading(q: LiveQuestion): string {
  if (q.type === 'quote') return QUOTE_HEADING;
  if (q.type === 'either') return EITHER_HEADING;
  return 'Deine Antwort';
}

/** Finale-Folien nach dem Ende der Runde (session.question_id in Phase `ended`). */
export const FINALE_SLIDES = [
  { id: 'final_live', label: 'Live-Ergebnis' },
  { id: 'final_team', label: 'Team-Sieger' },
  { id: 'final_solo', label: 'Solo-Sieger' },
  { id: 'final_gift', label: 'Das Geschenk' },
] as const;
export type FinaleSlide = (typeof FINALE_SLIDES)[number]['id'];

export function isFinaleSlide(id: string | null | undefined): id is FinaleSlide {
  return FINALE_SLIDES.some((s) => s.id === id);
}

/** Aufgaben-ID, unter der ein Gast als „dabei“ zählt (Lobby-Zähler, Team-Durchschnitt). */
export const LIVE_JOIN_TASK = 'live_join';
