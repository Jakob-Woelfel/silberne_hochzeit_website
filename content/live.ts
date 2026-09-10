/** Phase 4. Live-Session-Fragen – Jakob liefert die Inhalte. */
export type LiveQuestion =
  | { id: string; type: 'quote'; prompt: string; options: string[] }
  | { id: string; type: 'either'; prompt: string; options: string[] }
  | { id: string; type: 'menti'; prompt: string };

export const LIVE_QUESTIONS: LiveQuestion[] = [];
