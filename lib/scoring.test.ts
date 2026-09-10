import { describe, expect, it } from 'vitest';
import { maxPoints, normalizeText, score } from './scoring';
import type { Question } from '@/content/types';
import type { Solution } from '@/content/solutionTypes';

const q = (type: Question['type']) => ({ id: 'x', type, prompt: 'p' }) as Question;

describe('normalizeText', () => {
  it('trimmt, kleinschreibt und normalisiert Leerzeichen', () => {
    expect(normalizeText('  Bad   Nauheim ')).toBe('bad nauheim');
  });
  it('entfernt Satzzeichen am Ende', () => {
    expect(normalizeText('Katrin!')).toBe('katrin');
  });
});

describe('choice', () => {
  const sol: Solution = { type: 'choice', correct: 'Blond' };
  it('gibt 10 Punkte bei Treffer', () => {
    expect(score(q('choice'), sol, { type: 'choice', option: 'Blond' })).toBe(10);
  });
  it('ignoriert Groß/Kleinschreibung', () => {
    expect(score(q('choice'), sol, { type: 'choice', option: 'blond' })).toBe(10);
  });
  it('gibt 0 bei falscher Option', () => {
    expect(score(q('choice'), sol, { type: 'choice', option: 'Braun' })).toBe(0);
  });
  it('respektiert eigene Punktzahl', () => {
    const s: Solution = { type: 'choice', correct: 'A', points: 25 };
    expect(score(q('choice'), s, { type: 'choice', option: 'A' })).toBe(25);
  });
});

describe('estimate', () => {
  const sol: Solution = { type: 'estimate', correct: 9131 };
  it('20 Punkte bei unter 5 % Abweichung', () => {
    expect(score(q('estimate'), sol, { type: 'estimate', number: 9000 })).toBe(20);
  });
  it('15 Punkte bei unter 15 %', () => {
    expect(score(q('estimate'), sol, { type: 'estimate', number: 8200 })).toBe(15);
  });
  it('10 Punkte bei unter 30 %', () => {
    expect(score(q('estimate'), sol, { type: 'estimate', number: 7000 })).toBe(10);
  });
  it('5 Punkte bei unter 50 %', () => {
    expect(score(q('estimate'), sol, { type: 'estimate', number: 5000 })).toBe(5);
  });
  it('0 Punkte bei wilder Schätzung', () => {
    expect(score(q('estimate'), sol, { type: 'estimate', number: 100 })).toBe(0);
  });
  it('exakter Treffer bei Lösung 0', () => {
    const s: Solution = { type: 'estimate', correct: 0 };
    expect(score(q('estimate'), s, { type: 'estimate', number: 0 })).toBe(20);
    expect(score(q('estimate'), s, { type: 'estimate', number: 1 })).toBe(0);
  });
  it('0 Punkte bei NaN', () => {
    expect(score(q('estimate'), sol, { type: 'estimate', number: NaN })).toBe(0);
  });
});

describe('text', () => {
  const sol: Solution = { type: 'text', accept: ['Bad Nauheim', 'Nauheim'] };
  it('trifft eine der erlaubten Antworten', () => {
    expect(score(q('text'), sol, { type: 'text', text: ' nauheim ' })).toBe(10);
  });
  it('0 Punkte bei leerer Eingabe', () => {
    expect(score(q('text'), sol, { type: 'text', text: '   ' })).toBe(0);
  });
  it('0 Punkte bei falscher Antwort', () => {
    expect(score(q('text'), sol, { type: 'text', text: 'Berlin' })).toBe(0);
  });
});

describe('multi', () => {
  const sol: Solution = { type: 'multi', correct: ['Kassel', 'Marburg', 'Gießen'] };
  it('Punkte pro Treffer', () => {
    expect(score(q('multi'), sol, { type: 'multi', options: ['Kassel', 'Marburg'] })).toBe(10);
  });
  it('Abzug pro Fehler', () => {
    expect(
      score(q('multi'), sol, { type: 'multi', options: ['Kassel', 'Marburg', 'Berlin'] }),
    ).toBe(5);
  });
  it('nie unter 0', () => {
    expect(score(q('multi'), sol, { type: 'multi', options: ['Berlin', 'Hamburg'] })).toBe(0);
  });
  it('0 bei leerer Auswahl', () => {
    expect(score(q('multi'), sol, { type: 'multi', options: [] })).toBe(0);
  });
});

describe('order', () => {
  const sol: Solution = { type: 'order', correct: ['A', 'B', 'C', 'D'] };
  it('volle Punkte bei korrekter Reihenfolge', () => {
    expect(score(q('order'), sol, { type: 'order', items: ['A', 'B', 'C', 'D'] })).toBe(20);
  });
  it('Punkte pro korrekter Position', () => {
    expect(score(q('order'), sol, { type: 'order', items: ['A', 'C', 'B', 'D'] })).toBe(10);
  });
  it('0 bei komplett verdrehter Reihenfolge', () => {
    expect(score(q('order'), sol, { type: 'order', items: ['D', 'C', 'B', 'A'] })).toBe(0);
  });
  it('kommt mit unvollständiger Eingabe klar', () => {
    expect(score(q('order'), sol, { type: 'order', items: ['A'] })).toBe(5);
  });
});

describe('zoom', () => {
  const sol: Solution = { type: 'zoom', correct: 'Oma Helga' };
  it('30 Punkte auf Stufe 1', () => {
    expect(score(q('zoom'), sol, { type: 'zoom', option: 'Oma Helga', step: 1 })).toBe(30);
  });
  it('10 Punkte auf Stufe 3', () => {
    expect(score(q('zoom'), sol, { type: 'zoom', option: 'Oma Helga', step: 3 })).toBe(10);
  });
  it('0 bei falscher Person', () => {
    expect(score(q('zoom'), sol, { type: 'zoom', option: 'Opa Karl', step: 1 })).toBe(0);
  });
});

describe('age', () => {
  const sol: Solution = { type: 'age', correct: [24, 22] };
  it('summiert beide Schätzungen', () => {
    expect(score(q('age'), sol, { type: 'age', numbers: [24, 22] })).toBe(40);
  });
  it('wertet jede Person einzeln', () => {
    expect(score(q('age'), sol, { type: 'age', numbers: [24, 40] })).toBe(20);
  });
});

describe('Fehlformen', () => {
  it('0 Punkte, wenn Antworttyp nicht zur Lösung passt', () => {
    const sol: Solution = { type: 'choice', correct: 'A' };
    expect(score(q('choice'), sol, { type: 'text', text: 'A' })).toBe(0);
  });
});

describe('maxPoints', () => {
  it('choice', () => expect(maxPoints({ type: 'choice', correct: 'A' })).toBe(10));
  it('estimate', () => expect(maxPoints({ type: 'estimate', correct: 5 })).toBe(20));
  it('multi', () =>
    expect(maxPoints({ type: 'multi', correct: ['A', 'B', 'C'] })).toBe(15));
  it('order', () => expect(maxPoints({ type: 'order', correct: ['A', 'B'] })).toBe(10));
  it('zoom', () => expect(maxPoints({ type: 'zoom', correct: 'A' })).toBe(30));
  it('age', () => expect(maxPoints({ type: 'age', correct: [1, 2] })).toBe(40));
});
