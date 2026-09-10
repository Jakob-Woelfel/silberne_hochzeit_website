'use client';

import type { AnswerValue, Question } from '@/content/types';
import { ChoiceQuestion } from './ChoiceQuestion';
import { EstimateQuestion } from './EstimateQuestion';
import { MultiQuestion } from './MultiQuestion';
import { OrderQuestion } from './OrderQuestion';
import { TextQuestion } from './TextQuestion';

export type QuestionInputProps = {
  question: Question;
  value: AnswerValue | null;
  onChange: (value: AnswerValue) => void;
  disabled?: boolean;
};

/** Typ -> Eingabekomponente. Neue Aufgabentypen kommen hier dazu. */
export function QuestionInput({ question, ...rest }: QuestionInputProps) {
  switch (question.type) {
    case 'choice':
      return <ChoiceQuestion question={question} {...rest} />;
    case 'multi':
      return <MultiQuestion question={question} {...rest} />;
    case 'estimate':
      return <EstimateQuestion question={question} {...rest} />;
    case 'text':
      return <TextQuestion question={question} {...rest} />;
    case 'order':
      return <OrderQuestion question={question} {...rest} />;
    default:
      return (
        <p className="text-[var(--muted)]">
          Dieser Aufgabentyp kommt in einer späteren Version.
        </p>
      );
  }
}

/** Ist die Eingabe vollständig genug zum Absenden? */
export function isComplete(question: Question, value: AnswerValue | null): boolean {
  if (!value) return false;
  switch (value.type) {
    case 'choice':
      return value.option.length > 0;
    case 'text':
      return value.text.trim().length > 0;
    case 'estimate':
      return Number.isFinite(value.number);
    case 'multi':
      return value.options.length > 0;
    case 'order':
      return (
        question.type === 'order' && value.items.length === question.items.length
      );
    default:
      return false;
  }
}

/** Die eigene Antwort als lesbarer Text, für die Rückschau. */
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
    default:
      return '–';
  }
}
