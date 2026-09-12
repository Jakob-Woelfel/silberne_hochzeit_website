import { describe, expect, it, vi } from 'vitest';

// levels.solutions.ts importiert 'server-only', das außerhalb von React Server
// Components wirft. Im Test ist der Import unkritisch.
vi.mock('server-only', () => ({}));

import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { LEVELS, LEVEL_NUMBERS } from '@/content/levels';
import { SOLUTIONS } from '@/content/levels.solutions';
import { AGE_PHOTOS, ZOOM_PHOTOS } from '@/content/photos';
import { BINGO_POOL, BINGO_REQUIRED, BINGO_SIZE, bingoFieldsFor, bingoGridFor } from '@/content/bingo';
import { normalizeText } from './scoring';

const allQuestions = LEVEL_NUMBERS.flatMap((n) => LEVELS[n].questions);

/** Noch nicht eingetragene Werte (siehe Kopf von levels.solutions.ts) werden nicht geprüft. */
const isTodo = (s: string) => /^todo(\b|_)/i.test(s.trim());

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

  it('age: ein Alter je Person (eine oder zwei Personen)', () => {
    for (const q of allQuestions) {
      const s = SOLUTIONS[q.id];
      if (q.type === 'age' && s.type === 'age') {
        expect(q.people.length, `${q.id}: 1–2 Personen`).toBeGreaterThanOrEqual(1);
        expect(q.people.length, `${q.id}: 1–2 Personen`).toBeLessThanOrEqual(2);
        expect(s.correct.length, `${q.id}: Alter passt nicht zu people`).toBe(q.people.length);
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

/**
 * Fotos: jede Bild-ID einer Frage braucht einen Eintrag in content/photos.ts und –
 * sobald die ID kein TODO mehr ist – die erzeugten Dateien unter public/.
 */
describe('Fotos', () => {
  const root = path.resolve(__dirname, '..');
  const pub = path.join(root, 'public');

  it('content/photos.ts (enthält Originaldateinamen mit Lösung) wird nicht im Client verwendet', () => {
    const hits = execSync(
      "grep -rl \"content/photos\" app components lib --include=*.ts --include=*.tsx | grep -v '\\.test\\.ts$' || true",
      { cwd: root, encoding: 'utf8' },
    ).trim();
    expect(hits, `importiert content/photos: ${hits}`).toBe('');
  });

  it('zoom: photos.ts kennt jedes Bild, Ausschnitte liegen in public/zoom', () => {
    const known = new Set(ZOOM_PHOTOS.map((p) => p.id));
    for (const q of allQuestions) {
      if (q.type !== 'zoom') continue;
      expect(known.has(q.image), `${q.id}: '${q.image}' fehlt in ZOOM_PHOTOS`).toBe(true);
      if (isTodo(q.image)) continue;
      for (const step of [1, 2, 3]) {
        const file = path.join(pub, 'zoom', `${q.image}_${step}.jpg`);
        expect(existsSync(file), `${file} fehlt – npm run photos`).toBe(true);
      }
    }
  });

  it('age: photos.ts kennt jedes Bild, Datei liegt in public/age', () => {
    const known = new Set(AGE_PHOTOS.map((p) => p.id));
    for (const q of allQuestions) {
      if (q.type !== 'age') continue;
      expect(known.has(q.image), `${q.id}: '${q.image}' fehlt in AGE_PHOTOS`).toBe(true);
      if (isTodo(q.image)) continue;
      const file = path.join(pub, 'age', `${q.image}.jpg`);
      expect(existsSync(file), `${file} fehlt – npm run photos`).toBe(true);
    }
  });
});

describe('Bingo', () => {
  it('Pool ist groß genug für ein Grid', () => {
    expect(BINGO_POOL.length).toBeGreaterThanOrEqual(BINGO_SIZE);
  });
  it('IDs sind eindeutig und mit bingo_ präfixiert', () => {
    const ids = BINGO_POOL.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^bingo_\d+$/);
  });
  it('kein Feld kollidiert mit Bonus-IDs', () => {
    for (const f of BINGO_POOL) expect(f.id).not.toMatch(/^bingo_(row|col|full)/);
  });
  it('Pflichtfelder existieren im Pool', () => {
    for (const id of Object.keys(BINGO_REQUIRED)) {
      expect(BINGO_POOL.some((f) => f.id === id), `${id} fehlt im Pool`).toBe(true);
    }
  });

  const a = bingoFieldsFor('d645adf8-caa5-4a7b-b93d-07dada12a9e0');
  const b = bingoFieldsFor('1f0a9c2e-5b7d-4e8f-9a1b-2c3d4e5f6a7b');

  it('Grid hat genau BINGO_SIZE eindeutige Felder aus dem Pool', () => {
    for (const grid of [a, b]) {
      expect(grid.length).toBe(BINGO_SIZE);
      expect(new Set(grid.map((f) => f.id)).size).toBe(BINGO_SIZE);
      for (const f of grid) expect(BINGO_POOL).toContain(f);
    }
  });
  it('Pflichtfelder stehen an ihrer Position', () => {
    for (const [id, pos] of Object.entries(BINGO_REQUIRED)) {
      expect(a[pos].id).toBe(id);
      expect(b[pos].id).toBe(id);
    }
  });
  it('ist deterministisch pro Gast und unterschiedlich zwischen Gästen', () => {
    expect(bingoFieldsFor('d645adf8-caa5-4a7b-b93d-07dada12a9e0')).toEqual(a);
    expect(a.map((f) => f.id)).not.toEqual(b.map((f) => f.id));
  });
  it('Grid-Zeilen passen zu den Feldern', () => {
    const rows = bingoGridFor('d645adf8-caa5-4a7b-b93d-07dada12a9e0');
    expect(rows.flat()).toEqual(a.map((f) => f.id));
    for (const row of rows) expect(row.length).toBe(rows.length);
  });
});
