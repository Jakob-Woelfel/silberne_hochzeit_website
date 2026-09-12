import { LEVELS, LEVEL_NUMBERS } from '@/content/levels';
import { SOLUTIONS } from '@/content/levels.solutions';
import { maxPoints } from '@/lib/scoring';
import { describeSolution } from '@/lib/describeSolution';
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
  const image = 'image' in question ? question.image : null;
  const isPlaceholder =
    /PLATZHALTER|TODO/i.test(question.prompt) ||
    (image !== null && /^TODO/i.test(image)) ||
    ('options' in question && question.options.some((o) => /^TODO/i.test(o))) ||
    ('items' in question && question.items.some((o) => /^TODO/i.test(o))) ||
    (solution !== undefined && /TODO/i.test(describeSolution(solution)));
  const thumb =
    image === null || /^TODO/i.test(image)
      ? null
      : question.type === 'zoom'
        ? `/zoom/${image}_3.jpg`
        : `/age/${image}.jpg`;

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
      {question.type === 'age' && (
        <p className="mt-2 text-[15px] text-[var(--muted)]">
          Personen: {question.people.join(' · ')}
        </p>
      )}
      {image !== null && (
        <div className="mt-2 flex items-center gap-3">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element -- Admin, unoptimiert reicht
            <img
              src={thumb}
              alt=""
              className="h-16 w-16 rounded-lg border border-[var(--border)] object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-[12px] text-[var(--muted)]">
              kein Bild
            </span>
          )}
          <code className="text-[14px] text-[var(--muted)]">
            {question.type === 'zoom' ? `public/zoom/${image}_1..3.jpg` : `public/age/${image}.jpg`}
          </code>
        </div>
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
          Enthält noch TODO-Werte, muss vor der Feier ersetzt werden.
        </p>
      )}
    </div>
  );
}
