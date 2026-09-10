'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AnswerValue, Question } from '@/content/types';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { QuestionInput, describeAnswer, isComplete } from '@/components/questions';

export type SavedAnswer = { value: AnswerValue; points: number };

export function LevelPlayer({
  title,
  questions,
  saved,
}: {
  title: string;
  questions: Question[];
  saved: Record<string, SavedAnswer>;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, SavedAnswer>>(saved);
  const [draft, setDraft] = useState<AnswerValue | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // erste unbeantwortete Frage
  const firstOpen = questions.findIndex((q) => answers[q.id] === undefined);
  const [index, setIndex] = useState(firstOpen === -1 ? questions.length : firstOpen);

  const answeredCount = useMemo(
    () => questions.filter((q) => answers[q.id] !== undefined).length,
    [questions, answers],
  );
  const totalPoints = useMemo(
    () => questions.reduce((sum, q) => sum + (answers[q.id]?.points ?? 0), 0),
    [questions, answers],
  );

  if (index >= questions.length) {
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-2xl border border-[var(--accent)] bg-[var(--accent)]/8 p-6 text-center">
          <p className="text-[var(--muted)]">{title} geschafft</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{totalPoints} Punkte</p>
        </div>

        <ul className="flex flex-col gap-3">
          {questions.map((q) => {
            const a = answers[q.id];
            return (
              <li
                key={q.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <p className="font-medium">{q.prompt}</p>
                <div className="mt-2 flex items-baseline justify-between gap-3">
                  <p className="text-[15px] text-[var(--muted)]">
                    {a ? describeAnswer(a.value) : 'nicht beantwortet'}
                  </p>
                  <p className="shrink-0 font-semibold tabular-nums">
                    {a?.points ?? 0} P
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <Link href="/home" className="block">
          <Button variant="secondary">Zurück zur Übersicht</Button>
        </Link>
      </div>
    );
  }

  const question = questions[index];
  const existing = answers[question.id];
  const locked = existing !== undefined;
  const shown = locked ? existing.value : draft;

  async function submit() {
    if (pending || !draft) return;
    setPending(true);
    setError(null);

    try {
      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: question.id, value: draft }),
      });
      const data = await res.json();

      if (res.status === 409) {
        // schon beantwortet (z. B. zweites Gerät) – Serverstand übernehmen
        setAnswers((prev) => ({
          ...prev,
          [question.id]: { value: data.value as AnswerValue, points: data.points ?? 0 },
        }));
        setDraft(null);
        setPending(false);
        return;
      }

      if (!res.ok) {
        setError(data.error ?? 'Speichern fehlgeschlagen.');
        setPending(false);
        return;
      }

      setAnswers((prev) => ({
        ...prev,
        [question.id]: { value: draft, points: data.points ?? 0 },
      }));
      setDraft(null);
      router.refresh(); // Score im Header aktualisieren
    } catch {
      setError('Keine Verbindung. Deine Eingabe bleibt stehen – einfach nochmal tippen.');
    } finally {
      setPending(false);
    }
  }

  function next() {
    setDraft(null);
    setError(null);
    setIndex((i) => i + 1);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="mb-2 flex items-center justify-between text-[15px] text-[var(--muted)]">
          <span>
            Frage {index + 1} von {questions.length}
          </span>
          <span className="tabular-nums">{answeredCount} beantwortet</span>
        </div>
        <Progress value={answeredCount} max={questions.length} />
      </div>

      <div>
        <h1 className="text-xl font-semibold leading-snug">{question.prompt}</h1>
        {question.hint && (
          <p className="mt-2 text-[15px] text-[var(--muted)]">{question.hint}</p>
        )}
      </div>

      <QuestionInput
        question={question}
        value={shown}
        onChange={setDraft}
        disabled={locked || pending}
      />

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-[15px] text-red-800">{error}</p>
      )}

      {locked ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <p className="font-semibold tabular-nums">
              {existing.points} {existing.points === 1 ? 'Punkt' : 'Punkte'}
            </p>
            <p className="text-[15px] text-[var(--muted)]">
              Antwort gespeichert, Ändern ist nicht mehr möglich.
            </p>
          </div>
          {index + 1 < questions.length ? (
            <Button onClick={next}>Nächste Frage</Button>
          ) : (
            <Button onClick={next}>Level abschließen</Button>
          )}
        </div>
      ) : (
        <Button onClick={submit} disabled={pending || !isComplete(question, draft)}>
          {pending ? 'Wird gespeichert …' : 'Antwort abgeben'}
        </Button>
      )}
    </div>
  );
}
