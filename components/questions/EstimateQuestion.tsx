'use client';

import type { AnswerValue, EstimateQuestion as Q } from '@/content/types';

export function EstimateQuestion({
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
  const current =
    value?.type === 'estimate' && Number.isFinite(value.number) ? String(value.number) : '';

  return (
    <div className="flex items-center gap-3">
      <input
        type="number"
        inputMode="numeric"
        disabled={disabled}
        value={current}
        placeholder={question.placeholder ?? 'Deine Schätzung'}
        onChange={(e) => {
          const raw = e.target.value;
          onChange({ type: 'estimate', number: raw === '' ? NaN : Number(raw) });
        }}
        className="min-h-[56px] w-full rounded-xl border border-[var(--border)] bg-white px-4 outline-none focus:border-[var(--accent)] disabled:opacity-70"
      />
      {question.unit && (
        <span className="shrink-0 text-[var(--muted)]">{question.unit}</span>
      )}
    </div>
  );
}
