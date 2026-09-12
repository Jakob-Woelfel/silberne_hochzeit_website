import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { LEVELS, LEVEL_NUMBERS } from '@/content/levels';
import { SOLUTIONS } from '@/content/levels.solutions';
import { LIVE_QUESTIONS, liveHeading } from '@/content/live';
import { LIVE_SOLUTIONS } from '@/content/live.solutions';
import { unlockTimestamp } from '@/content/schedule';
import { isAdminPreview } from '@/lib/admin';
import { loadModuleAccess } from '@/lib/modules';
import { getAllAnswers, getGuest } from '@/lib/guest';
import { supabaseAdmin } from '@/lib/supabase/server';
import { describeSolution } from '@/lib/describeSolution';
import { describeAnswer } from '@/lib/describeAnswer';
import { BINGO_SOLO_FACTOR } from '@/lib/scoring';
import { Countdown } from '@/components/ui/Countdown';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { AnswerValue, Question } from '@/content/types';

export const dynamic = 'force-dynamic';

/**
 * Auflösung für alle Gäste ab 22 Uhr (content/schedule.ts, Modul `solutions`).
 * Davor verlassen die Lösungen den Server nicht – die Seite rendert nur den Countdown.
 */
export default async function SolutionsPage() {
  const guest = await getGuest();
  if (!guest) redirect('/start');

  if (!(await isAdminPreview()) && !(await loadModuleAccess()).isOpen('solutions')) {
    const target = unlockTimestamp('solutions');
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-semibold">Auflösung</h1>
        <Card>
          <p className="text-[var(--muted)]">
            Alle Fragen mit den richtigen Antworten gibt es hier ab 22 Uhr.
          </p>
          {target && (
            <p className="mt-2 text-3xl font-semibold">
              <Countdown target={target} fallback="…" />
            </p>
          )}
        </Card>
        <Link href="/home" className="block">
          <Button variant="secondary">Zurück zur Übersicht</Button>
        </Link>
      </div>
    );
  }

  const [answers, eitherAnswers] = await Promise.all([
    getAllAnswers(guest.id),
    loadEitherAnswers(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Auflösung</h1>
        <p className="text-[var(--muted)]">
          Alle Fragen des Tages mit den richtigen Antworten – und was du getippt hast.
        </p>
      </div>

      {LEVEL_NUMBERS.map((n) => {
        const level = LEVELS[n];
        const points = level.questions.reduce((s, q) => s + (answers[q.id]?.points ?? 0), 0);
        return (
          <section key={n} className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold">
                {level.title} · {level.subtitle}
              </h2>
              <span className="shrink-0 text-[15px] tabular-nums text-[var(--muted)]">
                {points} P
              </span>
            </div>
            {level.questions.map((q) => (
              <LevelCard
                key={q.id}
                question={q}
                answer={answers[q.id] ? { value: answers[q.id].value as AnswerValue, points: answers[q.id].points } : null}
              />
            ))}
          </section>
        );
      })}

      <Card>
        <p className="font-semibold">Selfie-Bingo</p>
        <p className="mt-1 text-[15px] text-[var(--muted)]">
          {(() => {
            const bingo = Object.entries(answers)
              .filter(([id]) => id.startsWith('bingo_'))
              .reduce((s, [, a]) => s + a.points, 0);
            return `${bingo} P für dein Team, davon ${Math.floor(bingo * BINGO_SOLO_FACTOR)} P in deinem Solo-Score.`;
          })()}
        </p>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Live-Runde</h2>
        {LIVE_QUESTIONS.filter((q) => q.type !== 'menti').map((q) => {
          const correct = q.type === 'either' ? (eitherAnswers[q.id] ?? LIVE_SOLUTIONS[q.id]) : LIVE_SOLUTIONS[q.id];
          const mine = answers[q.id];
          const myOption = mine && (mine.value as AnswerValue).type === 'live' ? (mine.value as { option: string }).option : null;
          return (
            <div key={q.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-[14px] uppercase tracking-wide text-[var(--muted)]">{liveHeading(q)}</p>
              <p className="mt-1 font-medium">{q.type === 'quote' ? `„${q.prompt}“` : q.prompt}</p>
              <SolutionRow
                solution={correct ?? '–'}
                mine={myOption}
                points={mine?.points ?? 0}
                answered={mine !== undefined}
              />
            </div>
          );
        })}
      </section>

      <Link href="/home" className="block">
        <Button variant="secondary">Zurück zur Übersicht</Button>
      </Link>
    </div>
  );
}

function LevelCard({
  question,
  answer,
}: {
  question: Question;
  answer: { value: AnswerValue; points: number } | null;
}) {
  const solution = SOLUTIONS[question.id];
  const image =
    question.type === 'zoom'
      ? `/zoom/${question.image}_3.jpg`
      : question.type === 'age'
        ? `/age/${question.image}.jpg`
        : null;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="font-medium">{question.prompt}</p>
      {image && (
        <Image
          src={image}
          alt=""
          width={800}
          height={800}
          sizes="(max-width: 640px) 100vw, 640px"
          className="mt-3 h-auto w-full rounded-xl border border-[var(--border)]"
        />
      )}
      <SolutionRow
        solution={solution ? describeSolution(solution, question) : '–'}
        mine={answer ? describeAnswer(answer.value) : null}
        points={answer?.points ?? 0}
        answered={answer !== null}
      />
    </div>
  );
}

function SolutionRow({
  solution,
  mine,
  points,
  answered,
}: {
  solution: string;
  mine: string | null;
  points: number;
  answered: boolean;
}) {
  return (
    <div className="mt-3 flex flex-col gap-1 border-t border-[var(--border)] pt-3 text-[15px]">
      <p>
        <span className="text-[var(--muted)]">Richtig: </span>
        <strong className="text-green-800">{solution}</strong>
      </p>
      <p className="flex items-baseline justify-between gap-3">
        <span>
          <span className="text-[var(--muted)]">Du: </span>
          {answered ? (mine ?? '–') : <span className="text-[var(--muted)]">nicht beantwortet</span>}
        </span>
        <span
          className={`shrink-0 font-semibold tabular-nums ${
            points > 0 ? 'text-green-800' : 'text-[var(--muted)]'
          }`}
        >
          {points} P
        </span>
      </p>
    </div>
  );
}

/**
 * Was die Eltern bei „Wer würde eher“ tatsächlich gesagt haben: die Option,
 * für die es Punkte gab. Der Host kann die Voreinstellung auf der Bühne
 * überschreiben – das ist nur in den Punkten gespeichert.
 */
async function loadEitherAnswers(): Promise<Record<string, string>> {
  const { data } = await supabaseAdmin()
    .from('answers')
    .select('task_id, value')
    .like('task_id', 'live_%')
    .gt('points', 0);
  const map: Record<string, string> = {};
  for (const row of (data ?? []) as unknown as { task_id: string; value: AnswerValue }[]) {
    if (row.value.type === 'live' && !map[row.task_id]) map[row.task_id] = row.value.option;
  }
  return map;
}
