/** Aufgabentypen (Kickoff 4.2). Client-safe: hier stehen KEINE Lösungen. */

export type QuestionBase = {
  /** eindeutig, Präfix bestimmt die Wertung: 'l1_q1' | 'bingo_1' | 'live_q1' */
  id: string;
  prompt: string;
  /** optionaler Zusatztext unter der Frage */
  hint?: string;
};

export type ChoiceQuestion = QuestionBase & {
  type: 'choice';
  options: string[];
};

export type EstimateQuestion = QuestionBase & {
  type: 'estimate';
  unit?: string;
  /** Platzhaltertext im Zahlenfeld */
  placeholder?: string;
};

export type TextQuestion = QuestionBase & {
  type: 'text';
  placeholder?: string;
};

export type MultiQuestion = QuestionBase & {
  type: 'multi';
  options: string[];
};

export type OrderQuestion = QuestionBase & {
  type: 'order';
  /** in zufälliger/neutraler Reihenfolge, der Gast tippt sie in die richtige */
  items: string[];
};

export type ZoomQuestion = QuestionBase & {
  type: 'zoom';
  /** public/zoom/<image>_1.jpg .. _3.jpg */
  image: string;
  options: string[];
};

export type AgeQuestion = QuestionBase & {
  type: 'age';
  image: string;
  /** die beiden Personen auf dem Foto */
  people: [string, string];
};

export type Question =
  | ChoiceQuestion
  | EstimateQuestion
  | TextQuestion
  | MultiQuestion
  | OrderQuestion
  | ZoomQuestion
  | AgeQuestion;

export type QuestionType = Question['type'];

/** Rohwert einer Antwort, so wie er in answers.value landet. */
export type AnswerValue =
  | { type: 'choice'; option: string }
  | { type: 'estimate'; number: number }
  | { type: 'text'; text: string }
  | { type: 'multi'; options: string[] }
  | { type: 'order'; items: string[] }
  | { type: 'zoom'; option: string; step: 1 | 2 | 3 }
  | { type: 'age'; numbers: [number, number] };
