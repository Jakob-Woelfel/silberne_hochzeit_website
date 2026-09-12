import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
  ADMIN_PREVIEW_COOKIE,
  isAdmin,
  keyMatches,
} from '@/lib/admin';
import { GUEST_COOKIE, GUEST_COOKIE_MAX_AGE } from '@/lib/guest';
import { supabaseAdmin } from '@/lib/supabase/server';
import { LIVE_BASE_POINTS, isFinaleSlide, liveQuestionById } from '@/content/live';
import { liveSolutionFor } from '@/content/live.solutions';
import { loadSession, rescoreEither, writeLiveBonus } from '@/lib/live';

export const dynamic = 'force-dynamic';

type Action =
  | { action: 'login'; key: string }
  | { action: 'logout' }
  | { action: 'preview'; on: boolean }
  | { action: 'impersonate'; guestId: string }
  | { action: 'stopImpersonate' }
  | { action: 'deleteGuest'; guestId: string }
  | { action: 'clearAnswers'; guestId: string }
  | { action: 'renameGuest'; guestId: string; name: string }
  | { action: 'setTeam'; guestId: string; teamId: number }
  | { action: 'resetAll'; confirm: string }
  // Live-Session (Host-Steuerung, Kickoff 4.4)
  | { action: 'liveLobby' }
  | { action: 'liveStart'; questionId: string }
  | { action: 'liveReveal' }
  | { action: 'liveParents'; answer: string }
  | { action: 'liveEnd' }
  | { action: 'liveSlide'; slide: string }
  | { action: 'liveIdle' }
  | { action: 'liveReset'; confirm: string };

export async function POST(request: Request) {
  let body: Action;
  try {
    body = (await request.json()) as Action;
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  // Anmeldung ist die einzige Aktion ohne bestehende Admin-Sitzung
  if (body.action === 'login') {
    if (!keyMatches(body.key)) {
      return NextResponse.json({ error: 'Schlüssel stimmt nicht.' }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, body.key, {
      path: '/',
      maxAge: ADMIN_COOKIE_MAX_AGE,
      sameSite: 'lax',
      httpOnly: true,
    });
    return res;
  }

  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Kein Admin-Zugang.' }, { status: 401 });
  }

  const db = supabaseAdmin();

  switch (body.action) {
    case 'logout': {
      const res = NextResponse.json({ ok: true });
      res.cookies.set(ADMIN_COOKIE, '', { path: '/', maxAge: 0 });
      res.cookies.set(ADMIN_PREVIEW_COOKIE, '', { path: '/', maxAge: 0 });
      return res;
    }

    case 'preview': {
      const res = NextResponse.json({ ok: true, preview: body.on });
      if (body.on) {
        res.cookies.set(ADMIN_PREVIEW_COOKIE, '1', {
          path: '/',
          maxAge: ADMIN_COOKIE_MAX_AGE,
          sameSite: 'lax',
          httpOnly: true,
        });
      } else {
        res.cookies.set(ADMIN_PREVIEW_COOKIE, '', { path: '/', maxAge: 0 });
      }
      return res;
    }

    case 'impersonate': {
      const { data } = await db
        .from('guests')
        .select('id, name')
        .eq('id', body.guestId)
        .maybeSingle();
      if (!data) {
        return NextResponse.json({ error: 'Gast nicht gefunden.' }, { status: 404 });
      }
      const res = NextResponse.json({ ok: true, name: (data as { name: string }).name });
      res.cookies.set(GUEST_COOKIE, body.guestId, {
        path: '/',
        maxAge: GUEST_COOKIE_MAX_AGE,
        sameSite: 'lax',
        httpOnly: false,
      });
      return res;
    }

    case 'stopImpersonate': {
      const res = NextResponse.json({ ok: true });
      res.cookies.set(GUEST_COOKIE, '', { path: '/', maxAge: 0 });
      return res;
    }

    case 'clearAnswers': {
      const { error } = await db.from('answers').delete().eq('guest_id', body.guestId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    case 'deleteGuest': {
      // uploads und answers haengen per on delete cascade daran
      const { error } = await db.from('guests').delete().eq('id', body.guestId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    case 'renameGuest': {
      const name = (body.name ?? '').trim().replace(/\s+/g, ' ');
      if (name.length < 2 || name.length > 40) {
        return NextResponse.json({ error: 'Name muss 2 bis 40 Zeichen haben.' }, { status: 400 });
      }
      const { error } = await db.from('guests').update({ name }).eq('id', body.guestId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, name });
    }

    case 'setTeam': {
      if (![1, 2, 3].includes(body.teamId)) {
        return NextResponse.json({ error: 'Team muss 1, 2 oder 3 sein.' }, { status: 400 });
      }
      const { error } = await db
        .from('guests')
        .update({ team_id: body.teamId })
        .eq('id', body.guestId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    case 'resetAll': {
      // Absichtlich sperrig: der Text muss exakt getippt werden.
      if (body.confirm !== 'ALLES LOESCHEN') {
        return NextResponse.json(
          { error: 'Bestätigungstext stimmt nicht.' },
          { status: 400 },
        );
      }
      // Reihenfolge egal, weil answers und uploads per Cascade an guests haengen.
      // Trotzdem explizit, falls die Constraint spaeter anders aussieht.
      const up = await db.from('uploads').delete().not('id', 'is', null);
      if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 });

      const ans = await db.from('answers').delete().not('task_id', 'is', null);
      if (ans.error) return NextResponse.json({ error: ans.error.message }, { status: 500 });

      const g = await db.from('guests').delete().not('id', 'is', null);
      if (g.error) return NextResponse.json({ error: g.error.message }, { status: 500 });

      await db
        .from('session')
        .update({
          phase: 'idle',
          question_id: null,
          started_at: null,
          parents_answer: null,
        })
        .eq('id', 1);
      // team_bonus gibt es erst nach 0003_live.sql – Fehler hier ist unkritisch
      await db.from('team_bonus').delete().not('team_id', 'is', null);

      const res = NextResponse.json({ ok: true });
      res.cookies.set(GUEST_COOKIE, '', { path: '/', maxAge: 0 });
      return res;
    }

    // ── Live-Session ────────────────────────────────────────────────────────

    case 'liveLobby': {
      const { error } = await db
        .from('session')
        .update({ phase: 'lobby', question_id: null, started_at: null, parents_answer: null })
        .eq('id', 1);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    case 'liveStart': {
      const question = liveQuestionById(body.questionId);
      if (!question) return NextResponse.json({ error: 'Frage unbekannt.' }, { status: 404 });
      // Eine Frage kann nur einmal laufen – sonst wären alte Antworten „zu früh“.
      const { count } = await db
        .from('answers')
        .select('guest_id', { count: 'exact', head: true })
        .eq('task_id', question.id);
      if ((count ?? 0) > 0) {
        return NextResponse.json(
          { error: 'Diese Frage wurde schon gespielt. Zum Wiederholen erst die Live-Runde zurücksetzen.' },
          { status: 409 },
        );
      }
      const { error } = await db
        .from('session')
        .update({
          phase: 'question',
          question_id: question.id,
          started_at: new Date().toISOString(),
          parents_answer: null,
        })
        .eq('id', 1);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    case 'liveReveal': {
      const session = await loadSession();
      const question = liveQuestionById(session.question_id);
      if (session.phase !== 'question' || !question) {
        return NextResponse.json({ error: 'Es läuft gerade keine Frage.' }, { status: 409 });
      }
      // quote: richtige Antwort. either: Voreinstellung, Host kann sie überschreiben.
      const answer = question.type === 'menti' ? null : (liveSolutionFor(question.id) ?? null);
      if (question.type === 'either' && answer) {
        await rescoreEither(question.id, answer, LIVE_BASE_POINTS);
      }
      const { error } = await db
        .from('session')
        .update({ phase: 'reveal', parents_answer: answer ? { answer } : null })
        .eq('id', 1);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, answer });
    }

    case 'liveParents': {
      const session = await loadSession();
      const question = liveQuestionById(session.question_id);
      if (session.phase !== 'reveal' || !question || question.type !== 'either') {
        return NextResponse.json(
          { error: 'Die Elternantwort gilt nur bei „Wer würde eher“ nach dem Auflösen.' },
          { status: 409 },
        );
      }
      const answer = question.options.find((o) => o === body.answer);
      if (!answer) return NextResponse.json({ error: 'Ungültige Antwort.' }, { status: 400 });
      await rescoreEither(question.id, answer, LIVE_BASE_POINTS);
      const { error } = await db
        .from('session')
        .update({ parents_answer: { answer } })
        .eq('id', 1);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, answer });
    }

    case 'liveEnd': {
      const { error: bonusError } = await writeLiveBonus();
      if (bonusError) {
        return NextResponse.json(
          { error: `Bonus konnte nicht gespeichert werden (0003_live.sql ausgeführt?): ${bonusError}` },
          { status: 500 },
        );
      }
      const { error } = await db
        .from('session')
        .update({ phase: 'ended', question_id: 'final_live', started_at: null, parents_answer: null })
        .eq('id', 1);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    case 'liveSlide': {
      if (!isFinaleSlide(body.slide)) {
        return NextResponse.json({ error: 'Unbekannte Folie.' }, { status: 400 });
      }
      const { error } = await db
        .from('session')
        .update({ phase: 'ended', question_id: body.slide })
        .eq('id', 1);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    case 'liveIdle': {
      // Zurück auf „noch nicht gestartet“, Antworten bleiben erhalten.
      const { error } = await db
        .from('session')
        .update({ phase: 'idle', question_id: null, started_at: null, parents_answer: null })
        .eq('id', 1);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    case 'liveReset': {
      if (body.confirm !== 'LIVE RESET') {
        return NextResponse.json({ error: 'Bestätigungstext stimmt nicht.' }, { status: 400 });
      }
      const ans = await db.from('answers').delete().like('task_id', 'live_%');
      if (ans.error) return NextResponse.json({ error: ans.error.message }, { status: 500 });
      await db.from('team_bonus').delete().not('team_id', 'is', null);
      const { error } = await db
        .from('session')
        .update({ phase: 'idle', question_id: null, started_at: null, parents_answer: null })
        .eq('id', 1);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: 'Unbekannte Aktion.' }, { status: 400 });
  }
}
