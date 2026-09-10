'use client';

import type { AnswerValue, ChoiceQuestion as Q } from '@/content/types';

export function ChoiceQuestion({
  question,
  value,
  onChange,
  disabled,
}: {
  question: Q;
  value: AnswerValue | null;
  onChange: (value: AnswerValue) => void;
  disabled?: boolean;
}) {
  const picked = value?.type === 'choice' ? value.option : null;

  return (
    <div className="flex flex-col gap-3">
      {question.options.map((option) => {
        const active = picked === option;
        return (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => onChange({ type: 'choice', option })}
            className={`min-h-[56px] w-full rounded-xl border px-4 text-left font-medium transition ${
              active
                ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent-strong)]'
                : 'border-[var(--border)] bg-white'
            } ${disabled ? 'opacity-70' : 'active:scale-[0.99]'}`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
