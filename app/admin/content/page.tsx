import { LEVELS, LEVEL_NUMBERS } from '@/content/levels';
import { SOLUTIONS } from '@/content/levels.solutions';
import { maxPoints } from '@/lib/scoring';
import type { Solution } from '@/content/solutionTypes';
import type { Question } from '@/content/types';

export const dynamic = 'force-dynamic';

/**
 * Fragen samt Loesungen. Diese Seite liegt hinter dem Admin-Gate,
 * die Loesungen stehen hier bewusst im Klartext.
 */
export default function AdminContentPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Inhalte</h1>
        <p className="mt-1 text-[15px] text-[var(--muted)]">
          Fragen aus <code>content/levels.ts</code>, Lösungen aus{' '}
          <code>content/levels.solutions.ts</code>. Beim Ersetzen muss die Kennung
          gleich bleiben.
        </p>
      </div>

      {LEVEL_NUMBERS.map((n) => {
        const level = LEVELS[n];
        return (
          <section key={n}>
            <h2 className="mb-3 text-lg font-semibold">
              {level.title} · {level.subtitle}
            </h2>
            {level.questions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-5 text-[var(--muted)]">
                Noch keine Fragen hinterlegt.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {level.questions.map((q) => (
                  <QuestionCard key={q.id} question={q} solution={SOLUTIONS[q.id]} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function QuestionCard({
  question,
  solution,
}: {
  question: Question;
  solution: Solution | undefined;
}) {
  const isPlaceholder = /PLATZHALTER/i.test(question.prompt);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <code className="text-[14px] text-[var(--muted)]">{question.id}</code>
        <span className="text-[14px] text-[var(--muted)]">
          {question.type}
          {solution ? ` · max. ${maxPoints(solution)} P` : ''}
        </span>
      </div>

      <p className="mt-1 font-medium">{question.prompt}</p>
      {question.hint && (
        <p className="mt-1 text-[15px] text-[var(--muted)]">{question.hint}</p>
      )}

      {'options' in question && (
        <p className="mt-2 text-[15px] text-[var(--muted)]">
          Optionen: {question.options.join(' · ')}
        </p>
      )}
      {'items' in question && (
        <p className="mt-2 text-[15px] text-[var(--muted)]">
          Einträge: {question.items.join(' · ')}
        </p>
      )}

      <p className="mt-2 text-[15px]">
        <span className="text-[var(--muted)]">Lösung: </span>
        {solution ? (
          <strong>{describeSolution(solution)}</strong>
        ) : (
          <span className="text-red-700">fehlt</span>
        )}
      </p>

      {isPlaceholder && (
        <p className="mt-2 text-[14px] text-amber-800">
          Noch ein Platzhalter, muss vor der Feier ersetzt werden.
        </p>
      )}
    </div>
  );
}

function describeSolution(solution: Solution): string {
  switch (solution.type) {
    case 'choice':
      return solution.correct;
    case 'estimate':
      return String(solution.correct);
    case 'text':
      return solution.accept.join(' oder ');
    case 'multi':
      return solution.correct.join(', ');
    case 'order':
      return solution.correct.map((s, i) => `${i + 1}. ${s}`).join('  ');
    case 'zoom':
      return solution.correct;
    case 'age':
      return `${solution.correct[0]} und ${solution.correct[1]}`;
  }
}
