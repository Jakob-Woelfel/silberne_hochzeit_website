'use client';

import Image from 'next/image';
import type { AgeQuestion as Q, AnswerValue } from '@/content/types';

/** Foto plus ein Zahlenfeld je Person (eine oder zwei). */
export function AgeQuestion({
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
  const numbers = value?.type === 'age' ? value.numbers : [];

  function update(index: number, raw: string) {
    const next = question.people.map((_, i) => numbers[i] ?? NaN);
    next[index] = raw === '' ? NaN : Number(raw);
    onChange({ type: 'age', numbers: next });
  }

  return (
    <div className="flex flex-col gap-4">
      <Image
        src={`/age/${question.image}.jpg`}
        alt={question.people.join(' und ')}
        width={1200}
        height={900}
        sizes="(max-width: 640px) 100vw, 640px"
        priority
        className="h-auto w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
      />

      {question.people.map((person, i) => {
        const current = Number.isFinite(numbers[i]) ? String(numbers[i]) : '';
        return (
          <label key={person} className="flex flex-col gap-2">
            <span className="font-medium">{person}</span>
            <span className="flex items-center gap-3">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={120}
                disabled={disabled}
                value={current}
                placeholder="Alter"
                onChange={(e) => update(i, e.target.value)}
                className="min-h-[56px] w-full rounded-xl border border-[var(--border)] bg-white px-4 outline-none focus:border-[var(--accent)] disabled:opacity-70"
              />
              <span className="shrink-0 text-[var(--muted)]">Jahre</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
