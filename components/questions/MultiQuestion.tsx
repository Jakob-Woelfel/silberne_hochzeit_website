'use client';

import type { AnswerValue, MultiQuestion as Q } from '@/content/types';

export function MultiQuestion({
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
  const picked = value?.type === 'multi' ? value.options : [];

  function toggle(option: string) {
    const next = picked.includes(option)
      ? picked.filter((o) => o !== option)
      : [...picked, option];
    onChange({ type: 'multi', options: next });
  }

  return (
    <div className="flex flex-col gap-3">
      {question.options.map((option) => {
        const active = picked.includes(option);
        return (
          <button
            key={option}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            onClick={() => toggle(option)}
            className={`flex min-h-[56px] w-full items-center gap-3 rounded-xl border px-4 text-left font-medium transition ${
              active
                ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent-strong)]'
                : 'border-[var(--border)] bg-white'
            } ${disabled ? 'opacity-70' : 'active:scale-[0.99]'}`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-[14px] font-bold ${
                active
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                  : 'border-[var(--border)]'
              }`}
              aria-hidden
            >
              {active ? '✓' : ''}
            </span>
            {option}
          </button>
        );
      })}
    </div>
  );
}
