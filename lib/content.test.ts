import { describe, expect, it, vi } from 'vitest';

// levels.solutions.ts importiert 'server-only', das außerhalb von React Server
// Components wirft. Im Test ist der Import unkritisch.
vi.mock('server-only', () => ({}));

import { LEVELS, LEVEL_NUMBERS } from '@/content/levels';
import { SOLUTIONS } from '@/content/levels.solutions';
import { normalizeText } from './scoring';

const allQuestions = LEVEL_NUMBERS.flatMap((n) => LEVELS[n].questions);

/** Noch nicht eingetragene Werte (siehe Kopf von levels.solutions.ts) werden nicht geprüft. */
const isTodo = (s: string) => /^todo\b/i.test(s.trim());

const sameSet = (a: string[], b: string[]) => {
  const na = a.map(normalizeText).sort();
  const nb = b.map(normalizeText).sort();
  return na.length === nb.length && na.every((x, i) => x === nb[i]);
};

/**
 * Fängt Tippfehler nach dem Eintragen der Inhalte: jede Frage braucht eine
 * Lösung, und die Lösung muss zu den angezeigten Optionen passen.
 */
describe('Fragen und Lösungen passen zusammen', () => {
  it('jede Frage hat eine Lösung vom gleichen Typ', () => {
    for (const q of allQuestions) {
      const s = SOLUTIONS[q.id];
      expect(s, `Lösung für ${q.id} fehlt`).toBeDefined();
      expect(s.type, `Typ von ${q.id}`).toBe(q.type);
    }
  });

  it('jede Lösung gehört zu einer Frage', () => {
    const ids = new Set(allQuestions.map((q) => q.id));
    for (const id of Object.keys(SOLUTIONS)) {
      expect(ids.has(id), `Lösung ${id} ohne Frage`).toBe(true);
    }
  });

  it('Fragen-IDs sind eindeutig', () => {
    const ids = allQuestions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('choice/zoom: die Lösung ist eine der Optionen', () => {
    for (const q of allQuestions) {
      const s = SOLUTIONS[q.id];
      if ((q.type === 'choice' && s.type === 'choice') || (q.type === 'zoom' && s.type === 'zoom')) {
        if (isTodo(s.correct)) continue;
        const opts = q.options.map(normalizeText);
        expect(opts, `${q.id}: '${s.correct}' ist keine Option`).toContain(normalizeText(s.correct));
      }
    }
  });

  it('multi: alle richtigen Antworten sind Optionen', () => {
    for (const q of allQuestions) {
      const s = SOLUTIONS[q.id];
      if (q.type === 'multi' && s.type === 'multi') {
        const opts = q.options.map(normalizeText);
        for (const c of s.correct) {
          expect(opts, `${q.id}: '${c}' ist keine Option`).toContain(normalizeText(c));
        }
      }
    }
  });

  it('order: Lösung enthält genau die angezeigten Items', () => {
    for (const q of allQuestions) {
      const s = SOLUTIONS[q.id];
      if (q.type === 'order' && s.type === 'order') {
        expect(sameSet(q.items, s.correct), `${q.id}: Items und Lösung unterscheiden sich`).toBe(true);
      }
    }
  });

  it('Optionen einer Frage sind eindeutig', () => {
    for (const q of allQuestions) {
      const list =
        q.type === 'choice' || q.type === 'multi' || q.type === 'zoom'
          ? q.options
          : q.type === 'order'
            ? q.items
            : [];
      expect(new Set(list.map(normalizeText)).size, `${q.id}: doppelte Optionen`).toBe(list.length);
    }
  });
});
