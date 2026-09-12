import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { FINALE_SLIDES, LIVE_QUESTIONS, PARENTS } from '@/content/live';
import { LIVE_SOLUTIONS } from '@/content/live.solutions';
import { moduleOfTask } from '@/content/schedule';

/** Fängt Tippfehler beim Einpflegen der Live-Fragen. */
describe('Live-Fragen und Lösungen', () => {
  it('IDs sind eindeutig und tragen das live_-Präfix', () => {
    const ids = LIVE_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(moduleOfTask(id), id).toBe('live');
      expect(FINALE_SLIDES.some((s) => s.id === id)).toBe(false);
    }
  });

  it('quote/either haben eine Lösung aus den Optionen, menti keine', () => {
    for (const q of LIVE_QUESTIONS) {
      const s = LIVE_SOLUTIONS[q.id];
      if (q.type === 'menti') {
        expect(s, `${q.id} (menti) braucht keine Lösung`).toBeUndefined();
        continue;
      }
      expect(s, `Lösung für ${q.id} fehlt`).toBeDefined();
      expect(q.options, `${q.id}: '${s}' ist keine Option`).toContain(s);
      expect(q.options).toEqual([...PARENTS]);
    }
  });

  it('jede Lösung gehört zu einer Frage', () => {
    const ids = new Set(LIVE_QUESTIONS.map((q) => q.id));
    for (const id of Object.keys(LIVE_SOLUTIONS)) {
      expect(ids.has(id), `Lösung ${id} ohne Frage`).toBe(true);
    }
  });

  it('Kickoff 12.7: mindestens 6 Zitate, 6 „Wer würde eher“, 2 Menti', () => {
    const count = (t: string) => LIVE_QUESTIONS.filter((q) => q.type === t).length;
    expect(count('quote')).toBeGreaterThanOrEqual(6);
    expect(count('either')).toBeGreaterThanOrEqual(6);
    expect(count('menti')).toBeGreaterThanOrEqual(2);
  });
});
