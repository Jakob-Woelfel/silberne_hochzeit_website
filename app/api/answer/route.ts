import { NextResponse } from 'next/server';
import { getGuestId } from '@/lib/guest';
import { supabaseAdmin } from '@/lib/supabase/server';
import { questionById } from '@/content/levels';
import { solutionFor } from '@/content/levels.solutions';
import { isFinalAnswer, normalizeText, score } from '@/lib/scoring';
import { isTaskOpen } from '@/lib/unlock';
import { isAdminPreview } from '@/lib/admin';
import { liveHasStarted } from '@/lib/live';
import type { AnswerValue } from '@/content/types';

export const dynamic = 'force-dynamic';

/**
 * Speichert genau eine Antwort und berechnet die Punkte serverseitig.
 * Die Lösung verlässt den Server nie – zurück gehen nur die erreichten Punkte.
 */
export async function POST(request: Request) {
  const guestId = await getGuestId();
  if (!guestId) {
    return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  }

  let body: { taskId?: unknown; value?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const taskId = body.taskId;
  if (typeof taskId !== 'string') {
    return NextResponse.json({ error: 'Ungültige Aufgabe.' }, { status: 400 });
  }

  const question = questionById(taskId);
  const solution = solutionFor(taskId);
  if (!question || !solution) {
    return NextResponse.json({ error: 'Aufgabe unbekannt.' }, { status: 404 });
  }

  // Der Admin-Vorschaumodus hebt die Sperre nur fuer diesen Browser auf.
  const preview = await isAdminPreview();
  if (!isTaskOpen(taskId) && !preview) {
    return NextResponse.json(
      { error: 'Diese Aufgabe ist noch nicht freigeschaltet.' },
      { status: 403 },
    );
  }
  // Mit der Live-Runde sind die Level zu (Kickoff 4.1).
  if (!preview && (await liveHasStarted())) {
    return NextResponse.json(
      { error: 'Die Level sind seit Beginn der Live-Runde geschlossen.' },
      { status: 403 },
    );
  }

  const value = body.value as AnswerValue;
  if (!value || typeof value !== 'object' || value.type !== question.type) {
    return NextResponse.json({ error: 'Antwortformat passt nicht.' }, { status: 400 });
  }

  if (
    question.type === 'age' &&
    value.type === 'age' &&
    (!Array.isArray(value.numbers) || value.numbers.length !== question.people.length)
  ) {
    return NextResponse.json({ error: 'Antwortformat passt nicht.' }, { status: 400 });
  }

  const db = supabaseAdmin();

  // Zoom: drei Versuche, die Zeile wird pro Tipp fortgeschrieben statt einmal eingefügt.
  if (question.type === 'zoom' && value.type === 'zoom') {
    const { data: existing } = await db
      .from('answers')
      .select('value, points')
      .eq('guest_id', guestId)
      .eq('task_id', taskId)
      .maybeSingle();

    const stored = (existing?.value as AnswerValue | null) ?? null;
    const storedGuesses = stored?.type === 'zoom' ? stored.guesses : [];

    if (existing && stored && isFinalAnswer(stored, existing.points)) {
      return NextResponse.json(
        { error: 'Diese Frage hast du schon beantwortet.', value: stored, points: existing.points },
        { status: 409 },
      );
    }

    // Der Server hängt genau einen Tipp an – der Client kann Stufen weder
    // überspringen noch zurücksetzen.
    const guess = value.guesses?.at(-1);
    const validOption =
      typeof guess === 'string' &&
      question.options.some((o) => normalizeText(o) === normalizeText(guess));
    const alreadyTried =
      typeof guess === 'string' &&
      storedGuesses.some((g) => normalizeText(g) === normalizeText(guess));
    if (!validOption || alreadyTried) {
      return NextResponse.json({ error: 'Ungültiger Tipp.' }, { status: 400 });
    }

    const next: AnswerValue = { type: 'zoom', guesses: [...storedGuesses, guess] };
    const points = score(question, solution, next);

    const { error } = await db
      .from('answers')
      .upsert({ guest_id: guestId, task_id: taskId, value: next, points });

    if (error) {
      console.error('zoom upsert failed', error);
      return NextResponse.json(
        { error: 'Speichern fehlgeschlagen. Bitte noch einmal versuchen.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ points, value: next, final: isFinalAnswer(next, points) });
  }

  const points = score(question, solution, value);

  const { error } = await db
    .from('answers')
    .insert({ guest_id: guestId, task_id: taskId, value, points });

  if (error) {
    // 23505 = unique_violation: bereits beantwortet, keine Korrektur möglich
    if (error.code === '23505') {
      const { data } = await db
        .from('answers')
        .select('value, points')
        .eq('guest_id', guestId)
        .eq('task_id', taskId)
        .maybeSingle();

      return NextResponse.json(
        {
          error: 'Diese Frage hast du schon beantwortet.',
          value: data?.value ?? null,
          points: data?.points ?? 0,
        },
        { status: 409 },
      );
    }

    console.error('answer insert failed', error);
    return NextResponse.json(
      { error: 'Speichern fehlgeschlagen. Bitte noch einmal versuchen.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ points, value, final: true });
}
