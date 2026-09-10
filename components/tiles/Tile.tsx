'use client';

import Link from 'next/link';
import { Countdown } from '@/components/ui/Countdown';
import { Progress } from '@/components/ui/Progress';

export type TileState =
  | { kind: 'locked'; unlockAt: number | null; note?: string }
  | { kind: 'open'; done: number; total: number }
  | { kind: 'done'; points: number }
  | { kind: 'soon'; note: string };

export function Tile({
  href,
  title,
  subtitle,
  state,
}: {
  href: string;
  title: string;
  subtitle: string;
  state: TileState;
}) {
  const clickable = state.kind === 'open' || state.kind === 'done';

  const body = (
    <div
      className={`rounded-2xl border p-5 ${
        clickable
          ? 'border-[var(--border)] bg-[var(--surface)]'
          : 'border-dashed border-[var(--border)] bg-transparent'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-lg font-semibold ${
              clickable ? '' : 'text-[var(--muted)]'
            }`}
          >
            {title}
          </p>
          <p className="text-[15px] text-[var(--muted)]">{subtitle}</p>
        </div>
        <StateBadge state={state} />
      </div>

      {state.kind === 'open' && state.total > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <Progress value={state.done} max={state.total} />
          <span className="shrink-0 text-[14px] tabular-nums text-[var(--muted)]">
            {state.done}/{state.total}
          </span>
        </div>
      )}
    </div>
  );

  return clickable ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    <div aria-disabled>{body}</div>
  );
}

function StateBadge({ state }: { state: TileState }) {
  if (state.kind === 'locked') {
    return (
      <span className="shrink-0 rounded-full bg-[var(--border)] px-3 py-1 text-[14px] text-[var(--muted)]">
        {state.unlockAt ? (
          <>
            in <Countdown target={state.unlockAt} />
          </>
        ) : (
          (state.note ?? 'gesperrt')
        )}
      </span>
    );
  }

  if (state.kind === 'soon') {
    return (
      <span className="shrink-0 rounded-full bg-[var(--border)] px-3 py-1 text-[14px] text-[var(--muted)]">
        {state.note}
      </span>
    );
  }

  if (state.kind === 'done') {
    return (
      <span className="shrink-0 rounded-full bg-[var(--accent)] px-3 py-1 text-[14px] font-semibold text-white tabular-nums">
        {state.points} P
      </span>
    );
  }

  return (
    <span className="shrink-0 rounded-full border border-[var(--accent)] px-3 py-1 text-[14px] font-semibold text-[var(--accent-strong)]">
      offen
    </span>
  );
}
