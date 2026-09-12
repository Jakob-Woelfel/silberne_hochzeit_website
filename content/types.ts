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
  /** public/age/<image>.jpg */
  image: string;
  /** eine oder zwei Personen auf dem Foto, je Person ein Zahlenfeld */
  people: string[];
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
  /** alle bisherigen Tipps; die Stufe ist guesses.length, pro Stufe ein Versuch */
  | { type: 'zoom'; guesses: string[] }
  /** ein Wert je Person, gleiche Reihenfolge wie question.people */
  | { type: 'age'; numbers: number[] }
  /** Bingo-Feld: Pfad des Selfies im Storage-Bucket `selfies` */
  | { type: 'bingo'; path: string }
  /** Bingo-Bonus (volle Reihe/Spalte/alles), automatisch vergeben */
  | { type: 'bingo_bonus'; line: string }
  /** Live-Session: Tipp bei quote/either; ms = Reaktionszeit ab Fragestart */
  | { type: 'live'; option: string; ms: number }
  /** Live-Session: Freitext (menti) */
  | { type: 'live_text'; text: string }
  /** Live-Session: Gast ist in der Lobby angekommen */
  | { type: 'live_join' };
