'use client';

import type { AnswerValue, TextQuestion as Q } from '@/content/types';

export function TextQuestion({
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
  const current = value?.type === 'text' ? value.text : '';

  return (
    <input
      type="text"
      disabled={disabled}
      value={current}
      maxLength={80}
      enterKeyHint="done"
      placeholder={question.placeholder ?? 'Deine Antwort'}
      onChange={(e) => onChange({ type: 'text', text: e.target.value })}
      className="min-h-[56px] w-full rounded-xl border border-[var(--border)] bg-white px-4 outline-none focus:border-[var(--accent)] disabled:opacity-70"
    />
  );
}
