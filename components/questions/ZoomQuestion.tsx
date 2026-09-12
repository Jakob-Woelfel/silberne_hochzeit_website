'use client';

import Image from 'next/image';
import type { AnswerValue, ZoomQuestion as Q } from '@/content/types';
import { ZOOM_POINTS, normalizeText } from '@/lib/scoring';

/**
 * Drei Zoomstufen, pro Stufe ein Tipp. `saved` ist der gespeicherte Stand
 * (bisherige Fehlversuche), `value` der Entwurf mit dem neuen Tipp obendrauf.
 */
export function ZoomQuestion({
  question,
  value,
  saved,
  onChange,
  disabled,
}: {
  question: Q;
  value: AnswerValue | null;
  saved?: AnswerValue | null;
  onChange: (value: AnswerValue) => void;
  disabled?: boolean;
}) {
  const tried = saved?.type === 'zoom' ? saved.guesses : [];
  const step = Math.min(tried.length + 1, ZOOM_POINTS.length);
  const draft = value?.type === 'zoom' ? value.guesses : [];
  const picked = draft.length > tried.length ? draft[draft.length - 1] : null;
  const isTried = (option: string) =>
    tried.some((g) => normalizeText(g) === normalizeText(option));

  return (
    <div className="flex flex-col gap-4">
      <Image
        key={step}
        src={`/zoom/${question.image}_${step}.jpg`}
        alt={`Zoomstufe ${step}`}
        width={800}
        height={800}
        sizes="(max-width: 640px) 100vw, 640px"
        priority
        className="h-auto w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
      />

      <p className="text-[15px] text-[var(--muted)]">
        Stufe {step} von {ZOOM_POINTS.length} · {ZOOM_POINTS[step - 1]} Punkte bei Treffer
      </p>

      <div className="flex flex-col gap-3">
        {question.options.map((option) => {
          const wrong = isTried(option);
          const active = picked === option;
          return (
            <button
              key={option}
              type="button"
              disabled={disabled || wrong}
              onClick={() => onChange({ type: 'zoom', guesses: [...tried, option] })}
              className={`min-h-[56px] w-full rounded-xl border px-4 text-left font-medium transition ${
                active
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent-strong)]'
                  : 'border-[var(--border)] bg-white'
              } ${wrong ? 'line-through opacity-50' : ''} ${
                disabled || wrong ? '' : 'active:scale-[0.99]'
              } ${disabled && !wrong ? 'opacity-70' : ''}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
