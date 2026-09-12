'use client';

import type { AnswerValue, Question } from '@/content/types';
import { ZOOM_POINTS } from '@/lib/scoring';
import { AgeQuestion } from './AgeQuestion';
import { ChoiceQuestion } from './ChoiceQuestion';
import { EstimateQuestion } from './EstimateQuestion';
import { MultiQuestion } from './MultiQuestion';
import { OrderQuestion } from './OrderQuestion';
import { TextQuestion } from './TextQuestion';
import { ZoomQuestion } from './ZoomQuestion';

export type QuestionInputProps = {
  question: Question;
  /** aktueller Entwurf bzw. die gespeicherte Antwort, wenn gesperrt */
  value: AnswerValue | null;
  /** bereits gespeicherter Stand – nur für Typen mit mehreren Versuchen (zoom) */
  saved?: AnswerValue | null;
  onChange: (value: AnswerValue) => void;
  disabled?: boolean;
};

/** Typ -> Eingabekomponente. Neue Aufgabentypen kommen hier dazu. */
export function QuestionInput({ question, saved, ...rest }: QuestionInputProps) {
  switch (question.type) {
    case 'zoom':
      return <ZoomQuestion question={question} saved={saved} {...rest} />;
    case 'age':
      return <AgeQuestion question={question} {...rest} />;
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

/** Ist die Eingabe vollständig genug zum Absenden? `saved` = gespeicherter Stand (zoom). */
export function isComplete(
  question: Question,
  value: AnswerValue | null,
  saved?: AnswerValue | null,
): boolean {
  if (!value) return false;
  switch (value.type) {
    case 'zoom': {
      const tried = saved?.type === 'zoom' ? saved.guesses.length : 0;
      return value.guesses.length === tried + 1 && tried < ZOOM_POINTS.length;
    }
    case 'age':
      return (
        question.type === 'age' &&
        value.numbers.length === question.people.length &&
        value.numbers.every((n) => Number.isFinite(n))
      );
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
export { describeAnswer } from '@/lib/describeAnswer';
