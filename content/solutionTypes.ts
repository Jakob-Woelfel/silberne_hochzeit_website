/** Lösungsformen. Der Typ ist client-safe, die Werte liegen in levels.solutions.ts. */

export type EstimateTiers = { within: number; points: number }[];

export type Solution =
  | { type: 'choice'; correct: string; points?: number }
  | { type: 'estimate'; correct: number; tiers?: EstimateTiers }
  | { type: 'text'; accept: string[]; points?: number }
  | { type: 'multi'; correct: string[]; perHit?: number; perMiss?: number }
  | { type: 'order'; correct: string[]; perPosition?: number }
  | { type: 'zoom'; correct: string }
  | { type: 'age'; correct: number[]; tiers?: EstimateTiers };
