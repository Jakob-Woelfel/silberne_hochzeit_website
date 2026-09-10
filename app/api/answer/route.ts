import { NextResponse } from 'next/server';
import { getGuestId } from '@/lib/guest';
import { supabaseAdmin } from '@/lib/supabase/server';
import { questionById } from '@/content/levels';
import { solutionFor } from '@/content/levels.solutions';
import { score } from '@/lib/scoring';
import { isTaskOpen } from '@/lib/unlock';
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

  if (!isTaskOpen(taskId)) {
    return NextResponse.json(
      { error: 'Diese Aufgabe ist noch nicht freigeschaltet.' },
      { status: 403 },
    );
  }

  const value = body.value as AnswerValue;
  if (!value || typeof value !== 'object' || value.type !== question.type) {
    return NextResponse.json({ error: 'Antwortformat passt nicht.' }, { status: 400 });
  }

  const points = score(question, solution, value);
  const db = supabaseAdmin();

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

  return NextResponse.json({ points, value });
}
