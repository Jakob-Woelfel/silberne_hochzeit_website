import type { AnswerValue } from '@/content/types';

/** Antwort als lesbaren Text – ohne 'use client', damit auch Server-Seiten sie nutzen. */
export function describeAnswer(value: AnswerValue): string {
  switch (value.type) {
    case 'choice':
      return value.option;
    case 'text':
      return value.text;
    case 'estimate':
      return Number.isFinite(value.number) ? String(value.number) : '–';
    case 'multi':
      return value.options.join(', ') || '–';
    case 'order':
      return value.items.map((item, i) => `${i + 1}. ${item}`).join('  ·  ');
    case 'zoom':
      return value.guesses.length === 0
        ? '–'
        : `${value.guesses.length}. Tipp: ${value.guesses[value.guesses.length - 1]}`;
    case 'age':
      return value.numbers.map((n) => (Number.isFinite(n) ? String(n) : '–')).join(' und ');
    default:
      return '–';
  }
}
