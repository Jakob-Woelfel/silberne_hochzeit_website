'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  LIVE_QUESTIONS,
  liveHeading,
  liveQuestionById,
  liveQuestionIndex,
  type LiveQuestion,
} from '@/content/live';
import type { LiveMe } from '@/lib/live';
import type { AnswerValue } from '@/content/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useSessionSignal } from './useSessionSignal';
import { useNow } from './useNow';

const POLL_MS = 2500;

/**
 * Handy-Ansicht der Live-Runde. Zustand kommt komplett vom Server
 * (/api/live/me): Realtime auf `session` stößt einen sofortigen Abruf an,
 * Polling alle 2,5 s fängt abgebrochene Websockets ab (Kickoff §8).
 */
export function LiveClient({
  initial,
  teamName,
  teamColor,
}: {
  initial: LiveMe;
  teamName: string | null;
  teamColor: string | null;
}) {
  const [me, setMe] = useState<LiveMe>(initial);
  const [offset, setOffset] = useState(() => initial.serverNow - Date.now());
  const [offline, setOffline] = useState(false);
  const joinedFor = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/live/me', { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as LiveMe;
      setOffset(data.serverNow - Date.now());
      setMe(data);
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, []);

  // Realtime: jede Änderung der session-Zeile -> sofort nachladen
  useSessionSignal(refresh);

  // Polling-Fallback
  useEffect(() => {
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  // In der Lobby anmelden (einmal pro Phase-Wechsel aus idle heraus)
  const phase = me.session.phase;
  useEffect(() => {
    const active = phase === 'lobby' || phase === 'question' || phase === 'reveal';
    if (phase === 'idle') joinedFor.current = null; // nach einem Reset neu anmelden
    if (!active || joinedFor.current === 'done') return;
    joinedFor.current = 'done';
    fetch('/api/live/join', { method: 'POST' })
      .then(() => refresh())
      .catch(() => {
        joinedFor.current = null;
      });
  }, [phase, refresh]);

  const question = liveQuestionById(me.session.question_id);
  const mine = question ? me.mine[question.id] : undefined;

  // Live-Punkte des Gasts (nur aufgedeckte Fragen haben `points`)
  const livePoints = Object.values(me.mine).reduce((s, a) => s + (a.points ?? 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Live-Runde</h1>
          {teamName && (
            <p className="flex items-center gap-1.5 text-[15px] text-[var(--muted)]">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: teamColor ?? '#999' }}
                aria-hidden
              />
              Du spielst für {teamName}
            </p>
          )}
        </div>
        {phase !== 'idle' && (
          <p className="shrink-0 rounded-full bg-[var(--border)] px-3 py-1 text-[14px] tabular-nums text-[var(--muted)]">
            {livePoints} P
          </p>
        )}
      </div>

      {offline && (
        <p className="rounded-xl bg-amber-50 px-4 py-2 text-[15px] text-amber-900">
          Verbindung hakt – wir versuchen es weiter.
        </p>
      )}

      {phase === 'idle' && <Idle />}
      {phase === 'lobby' && <Lobby joined={me.joined} />}
      {phase === 'question' && question && (
        <QuestionView
          key={question.id}
          question={question}
          mine={mine?.value ?? null}
          deadline={me.deadline}
          offset={offset}
          onAnswered={refresh}
        />
      )}
      {phase === 'reveal' && question && (
        <RevealView question={question} mine={mine ?? null} revealed={me.revealed} />
      )}
      {phase === 'ended' && <Ended points={livePoints} />}
    </div>
  );
}

function Idle() {
  return (
    <>
      <Card>
        <p className="text-lg font-semibold">Noch nicht gestartet</p>
        <p className="mt-1 text-[var(--muted)]">
          Am Abend spielen alle gleichzeitig: Zitate zuordnen und „Wer würde eher …“. Sobald es losgeht, erscheint hier die erste Frage – die Seite
          aktualisiert sich von selbst.
        </p>
      </Card>
      <Link href="/home" className="block">
        <Button variant="secondary">Zurück zur Übersicht</Button>
      </Link>
    </>
  );
}

function Lobby({ joined }: { joined: number }) {
  return (
    <Card className="text-center">
      <p className="text-[var(--muted)]">Gleich geht’s los</p>
      <p className="mt-2 text-4xl font-semibold tabular-nums">{joined}</p>
      <p className="text-[var(--muted)]">{joined === 1 ? 'Gast ist' : 'Gäste sind'} schon dabei</p>
      <p className="mt-5 text-[15px] text-[var(--muted)]">
        Handy in der Hand behalten – die Fragen erscheinen hier automatisch. Pro Frage
        hast du ein paar Sekunden, schnelle richtige Antworten bringen extra Punkte.
      </p>
    </Card>
  );
}

function useCountdown(deadline: number | null, offset: number): number | null {
  const now = useNow(deadline !== null);
  if (deadline === null) return null;
  return Math.max(0, deadline - (now + offset));
}

function QuestionView({
  question,
  mine,
  deadline,
  offset,
  onAnswered,
}: {
  question: LiveQuestion;
  mine: AnswerValue | null;
  deadline: number | null;
  offset: number;
  onAnswered: () => void;
}) {
  const left = useCountdown(deadline, offset);
  const [draft, setDraft] = useState('');
  const [sent, setSent] = useState<AnswerValue | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answered = mine ?? sent;
  const secondsLeft = left === null ? null : Math.ceil(left / 1000);
  const timeUp = left !== null && left <= 0;
  const index = liveQuestionIndex(question.id);

  async function send(value: AnswerValue) {
    if (pending || answered) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch('/api/live/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, value }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok || res.status === 409) {
        // 409 = schon geantwortet oder Zeit um: Serverstand übernehmen
        if (res.ok) setSent(data.value ?? value);
        else setError(data.error ?? null);
        onAnswered();
      } else {
        setError(data.error ?? 'Senden fehlgeschlagen. Noch einmal tippen.');
      }
    } catch {
      setError('Keine Verbindung – noch einmal tippen.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-[15px] text-[var(--muted)]">
        <span>
          Frage {index + 1} von {LIVE_QUESTIONS.length}
        </span>
        <span
          className={`rounded-full px-3 py-1 font-semibold tabular-nums ${
            timeUp
              ? 'bg-[var(--border)] text-[var(--muted)]'
              : secondsLeft !== null && secondsLeft <= 5
                ? 'bg-red-600 text-white'
                : 'bg-[var(--accent)] text-white'
          }`}
        >
          {secondsLeft === null ? '…' : timeUp ? 'Zeit um' : `${secondsLeft} s`}
        </span>
      </div>

      <div>
        <p className="text-[15px] font-medium uppercase tracking-wide text-[var(--muted)]">
          {liveHeading(question)}
        </p>
        <h2
          className={`mt-1 font-semibold leading-snug ${
            question.type === 'quote' ? 'text-xl' : 'text-2xl'
          }`}
        >
          {question.type === 'quote' ? `„${question.prompt}“` : question.prompt}
        </h2>
      </div>

      {answered ? (
        <Card className="text-center">
          <p className="text-lg font-semibold">
            {answered.type === 'live'
              ? answered.option
              : answered.type === 'live_text'
                ? `„${answered.text}“`
                : '–'}
          </p>
          <p className="mt-1 text-[var(--muted)]">
            Gespeichert. Gleich kommt die Auflösung auf der Leinwand.
          </p>
        </Card>
      ) : timeUp ? (
        <Card className="text-center">
          <p className="text-lg font-semibold">Zeit abgelaufen</p>
          <p className="mt-1 text-[var(--muted)]">Bei der nächsten Frage bist du schneller.</p>
        </Card>
      ) : question.type === 'menti' ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) void send({ type: 'live_text', text: draft.trim() });
          }}
        >
          <input
            type="text"
            value={draft}
            maxLength={40}
            autoFocus
            placeholder={question.placeholder ?? 'Deine Antwort'}
            onChange={(e) => setDraft(e.target.value)}
            disabled={pending}
            className="min-h-[56px] w-full rounded-xl border border-[var(--border)] bg-white px-4 text-[17px]"
          />
          <Button type="submit" disabled={pending || draft.trim().length === 0}>
            {pending ? 'Wird gesendet …' : 'Abschicken'}
          </Button>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          {question.options.map((option) => (
            <button
              key={option}
              type="button"
              disabled={pending}
              onClick={() => send({ type: 'live', option, ms: 0 })}
              className="min-h-[72px] w-full rounded-2xl border-2 border-[var(--accent)] bg-white px-5 text-2xl font-semibold text-[var(--accent-strong)] transition active:scale-[0.98] disabled:opacity-60"
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-[15px] text-red-800">{error}</p>
      )}
    </div>
  );
}

function RevealView({
  question,
  mine,
  revealed,
}: {
  question: LiveQuestion;
  mine: { value: AnswerValue; points?: number } | null;
  revealed: string | null;
}) {
  const myOption = mine?.value.type === 'live' ? mine.value.option : null;
  const points = mine?.points ?? 0;
  const correct = revealed !== null && myOption !== null && myOption === revealed;

  if (question.type === 'menti') {
    return (
      <Card className="text-center">
        <p className="text-[var(--muted)]">{question.prompt}</p>
        {mine?.value.type === 'live_text' && (
          <p className="mt-2 text-xl font-semibold">„{mine.value.text}“</p>
        )}
        <p className="mt-4 text-[var(--muted)]">Alle Antworten stehen jetzt auf der Leinwand.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[15px] font-medium uppercase tracking-wide text-[var(--muted)]">
          {liveHeading(question)}
        </p>
        <p className="mt-1 text-lg leading-snug">
          {question.type === 'quote' ? `„${question.prompt}“` : question.prompt}
        </p>
      </div>

      <Card className="text-center">
        <p className="text-[var(--muted)]">
          {question.type === 'quote' ? 'Geschrieben hat das' : 'Die Eltern sagen'}
        </p>
        <p className="mt-1 text-4xl font-semibold">{revealed ?? '…'}</p>
      </Card>

      <div
        className={`rounded-2xl border p-5 text-center ${
          myOption === null
            ? 'border-[var(--border)] bg-[var(--surface)]'
            : correct
              ? 'border-green-600 bg-green-50'
              : 'border-red-300 bg-red-50'
        }`}
      >
        {myOption === null ? (
          <p className="text-[var(--muted)]">Du hast nicht getippt.</p>
        ) : (
          <>
            <p className="font-semibold">
              {correct ? 'Richtig!' : 'Leider daneben'}{' '}
              <span className="font-normal text-[var(--muted)]">(du: {myOption})</span>
            </p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">+{points} P</p>
            {correct && question.type === 'quote' && points > 100 && (
              <p className="text-[15px] text-[var(--muted)]">davon {points - 100} Tempobonus</p>
            )}
          </>
        )}
      </div>

      <p className="text-center text-[15px] text-[var(--muted)]">
        Gleich geht’s weiter – Handy bereithalten.
      </p>
    </div>
  );
}

function Ended({ points }: { points: number }) {
  return (
    <>
      <Card className="text-center">
        <p className="text-lg font-semibold">Das war die Live-Runde</p>
        <p className="mt-1 text-[var(--muted)]">
          Du hast <strong className="text-[var(--foreground)]">{points} Punkte</strong> für dein
          Team geholt. Die Auflösung läuft jetzt auf der Leinwand.
        </p>
      </Card>
      <Link href="/ranking" className="block">
        <Button variant="secondary">Zum Ranking</Button>
      </Link>
    </>
  );
}
