import { NextResponse } from 'next/server';
import { getGuestId } from '@/lib/guest';
import { supabaseAdmin } from '@/lib/supabase/server';
import {
  LIVE_BASE_POINTS,
  LIVE_GRACE_MS,
  LIVE_JOIN_TASK,
  LIVE_SECONDS,
  LIVE_SPEED_BONUS,
  liveQuestionById,
} from '@/content/live';
import { liveSolutionFor } from '@/content/live.solutions';
import { loadSession } from '@/lib/live';
import { liveGuessPoints, normalizeText } from '@/lib/scoring';
import type { AnswerValue } from '@/content/types';

export const dynamic = 'force-dynamic';

const MAX_TEXT = 40;

/**
 * Ein Tipp in der Live-Runde. Gilt nur, solange genau diese Frage läuft
 * (Serverzeit + Toleranz). Punkte werden hier berechnet, aber erst bei der
 * Auflösung an den Gast ausgeliefert (/api/live/me).
 */
export async function POST(request: Request) {
  const guestId = await getGuestId();
  if (!guestId) {
    return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  }

  let body: { questionId?: unknown; value?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const question = typeof body.questionId === 'string' ? liveQuestionById(body.questionId) : undefined;
  if (!question) {
    return NextResponse.json({ error: 'Frage unbekannt.' }, { status: 404 });
  }

  const session = await loadSession();
  if (session.phase !== 'question' || session.question_id !== question.id || !session.started_at) {
    return NextResponse.json({ error: 'Diese Frage läuft gerade nicht.' }, { status: 409 });
  }

  const startedAt = Date.parse(session.started_at);
  const elapsedMs = Date.now() - startedAt;
  if (elapsedMs > LIVE_SECONDS * 1000 + LIVE_GRACE_MS) {
    return NextResponse.json({ error: 'Die Zeit ist um.' }, { status: 409 });
  }

  const raw = body.value as Partial<AnswerValue> | undefined;
  let value: AnswerValue;
  let points = 0;

  if (question.type === 'menti') {
    const text =
      raw?.type === 'live_text' && typeof raw.text === 'string'
        ? raw.text.trim().replace(/\s+/g, ' ').slice(0, MAX_TEXT)
        : '';
    if (text.length === 0) {
      return NextResponse.json({ error: 'Bitte etwas eintippen.' }, { status: 400 });
    }
    value = { type: 'live_text', text };
  } else {
    const option =
      raw?.type === 'live' && typeof raw.option === 'string'
        ? question.options.find((o) => normalizeText(o) === normalizeText(raw.option as string))
        : undefined;
    if (!option) {
      return NextResponse.json({ error: 'Ungültige Antwort.' }, { status: 400 });
    }
    value = { type: 'live', option, ms: Math.max(0, elapsedMs) };

    if (question.type === 'quote') {
      const correct = liveSolutionFor(question.id);
      points = liveGuessPoints(correct !== undefined && normalizeText(correct) === normalizeText(option), {
        elapsedMs,
        limitMs: LIVE_SECONDS * 1000,
        base: LIVE_BASE_POINTS,
        speedBonus: LIVE_SPEED_BONUS,
      });
    }
    // either: Punkte kommen bei der Auflösung (rescoreEither), bis dahin 0
  }

  const db = supabaseAdmin();
  const { error } = await db
    .from('answers')
    .insert({ guest_id: guestId, task_id: question.id, value, points });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Du hast schon geantwortet.' }, { status: 409 });
    }
    console.error('live answer failed', error);
    return NextResponse.json(
      { error: 'Speichern fehlgeschlagen. Bitte noch einmal tippen.' },
      { status: 500 },
    );
  }

  // Wer antwortet, ist dabei – auch wenn die Lobby verpasst wurde.
  await db
    .from('answers')
    .upsert({ guest_id: guestId, task_id: LIVE_JOIN_TASK, value: { type: 'live_join' }, points: 0 }, { ignoreDuplicates: true });

  return NextResponse.json({ ok: true, value });
}
