'use client';

import type { AnswerValue, OrderQuestion as Q } from '@/content/types';

/**
 * Kein Drag-and-Drop (Kickoff §3). Der Gast tippt die Einträge in der richtigen
 * Reihenfolge an; ein Tap auf einen bereits gewählten Eintrag nimmt ihn zurück.
 */
export function OrderQuestion({
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
  const picked = value?.type === 'order' ? value.items : [];
  const remaining = question.items.filter((item) => !picked.includes(item));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-[15px] font-medium text-[var(--muted)]">
          Deine Reihenfolge
        </p>
        {picked.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-5 text-[15px] text-[var(--muted)]">
            Tippe unten den Eintrag an, der zuerst kommt.
          </div>
        ) : (
          <ol className="flex flex-col gap-2">
            {picked.map((item, index) => (
              <li key={item}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ type: 'order', items: picked.slice(0, index) })}
                  className="flex min-h-[56px] w-full items-center gap-3 rounded-xl border border-[var(--accent)] bg-[var(--accent)]/10 px-4 text-left font-medium disabled:opacity-70"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[14px] font-bold text-white tabular-nums">
                    {index + 1}
                  </span>
                  {item}
                </button>
              </li>
            ))}
          </ol>
        )}
        {picked.length > 0 && !disabled && (
          <p className="mt-2 text-[14px] text-[var(--muted)]">
            Tippe einen Eintrag an, um ab dort neu zu sortieren.
          </p>
        )}
      </div>

      {remaining.length > 0 && (
        <div>
          <p className="mb-2 text-[15px] font-medium text-[var(--muted)]">
            Noch offen
          </p>
          <div className="flex flex-col gap-2">
            {remaining.map((item) => (
              <button
                key={item}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ type: 'order', items: [...picked, item] })}
                className="min-h-[56px] w-full rounded-xl border border-[var(--border)] bg-white px-4 text-left font-medium active:scale-[0.99] disabled:opacity-70"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
