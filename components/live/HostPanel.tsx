'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ScreenPayload } from '@/app/api/live/screen/route';
import {
  FINALE_SLIDES,
  LIVE_QUESTIONS,
  LIVE_SECONDS,
  liveHeading,
  type LiveQuestion,
} from '@/content/live';
import { useAdminAction } from '@/components/admin/useAdminAction';
import { useScreenState, useSecondsLeft } from './useScreenState';

const RESET_PHRASE = 'LIVE RESET';

const PHASE_LABEL: Record<string, string> = {
  idle: 'nicht gestartet',
  lobby: 'Lobby offen',
  question: 'Frage läuft',
  reveal: 'Auflösung',
  ended: 'Finale',
};

/**
 * Host-Steuerung der Live-Runde (Kickoff 4.4). Lösungen stehen hier im
 * Klartext – die Seite liegt deshalb hinter /admin.
 */
export function HostPanel({
  initial,
  solutions,
}: {
  initial: ScreenPayload;
  solutions: Record<string, string>;
}) {
  const { state, offset, error: loadError, refresh } = useScreenState(initial, null, 2000);
  const { run, pending, error } = useAdminAction();
  const secondsLeft = useSecondsLeft(state.deadline, offset);
  const [resetText, setResetText] = useState('');

  const { session, question, played } = state;
  const phase = session.phase;

  const nextQuestion = LIVE_QUESTIONS.find((q) => !played.includes(q.id) && q.id !== question?.id);

  async function act(label: string, body: Record<string, unknown>) {
    const ok = await run(label, body);
    if (ok) await refresh();
  }

  const busy = pending !== null;

  return (
    <div className="flex flex-col gap-6">
      {!state.migrationOk && (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[15px] text-red-900">
          Tabelle <code>team_bonus</code> fehlt. Bitte <code>supabase/migrations/0003_live.sql</code>{' '}
          im SQL-Editor ausführen, sonst kann die Runde nicht beendet werden.
        </p>
      )}
      {loadError && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[15px] text-amber-900">
          {loadError}
        </p>
      )}

      {/* Status */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[14px] text-[var(--muted)]">Phase</p>
            <p className="text-xl font-semibold">{PHASE_LABEL[phase] ?? phase}</p>
          </div>
          <div className="text-right">
            <p className="text-[14px] text-[var(--muted)]">Dabei</p>
            <p className="text-xl font-semibold tabular-nums">{state.participants.total}</p>
          </div>
          {phase === 'question' && (
            <div className="text-right">
              <p className="text-[14px] text-[var(--muted)]">Restzeit</p>
              <p
                className={`text-xl font-semibold tabular-nums ${
                  secondsLeft === 0 ? 'text-red-700' : ''
                }`}
              >
                {secondsLeft === null ? '…' : `${secondsLeft} s`}
              </p>
            </div>
          )}
          {(phase === 'question' || phase === 'reveal') && (
            <div className="text-right">
              <p className="text-[14px] text-[var(--muted)]">Geantwortet</p>
              <p className="text-xl font-semibold tabular-nums">
                {state.answered.total} / {state.participants.total}
              </p>
            </div>
          )}
        </div>

        {question && (
          <div className="mt-4 border-t border-[var(--border)] pt-3">
            <p className="text-[14px] text-[var(--muted)]">
              Frage {state.questionIndex + 1} von {state.totalQuestions} · {liveHeading(question)}
            </p>
            <p className="mt-1 font-medium">{question.prompt}</p>
            {solutions[question.id] && (
              <p className="mt-1 text-[15px] text-[var(--muted)]">
                Lösung: <strong className="text-[var(--foreground)]">{solutions[question.id]}</strong>
                {phase === 'reveal' && state.revealed && state.revealed !== solutions[question.id] && (
                  <> · aufgedeckt: <strong className="text-[var(--foreground)]">{state.revealed}</strong></>
                )}
              </p>
            )}
          </div>
        )}

        {/* Verteilung während Auflösung */}
        {phase === 'reveal' && question && question.type !== 'menti' && (
          <ul className="mt-3 flex flex-col gap-1 text-[15px]">
            {state.options.map((o) => (
              <li key={o.option} className="flex justify-between tabular-nums">
                <span className={o.option === state.revealed ? 'font-semibold' : ''}>{o.option}</span>
                <span>
                  {o.total}{' '}
                  <span className="text-[var(--muted)]">
                    ({state.teams.map((t) => `${t.name.slice(0, 6)}: ${o.byTeam[t.teamId] ?? 0}`).join(' · ')})
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {phase === 'reveal' && question?.type === 'menti' && (
          <p className="mt-3 text-[15px] text-[var(--muted)]">
            {state.words.length} verschiedene Antworten – siehe Beamer.
          </p>
        )}
      </section>

      {/* Aktionen */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Steuerung</h2>

        {phase === 'idle' && (
          <>
            <p className="text-[15px] text-[var(--muted)]">
              „Lobby öffnen“ schließt Level 1–3 und das Bingo für alle Gäste und zeigt ihnen
              den Warteschirm. Die Level bleiben zu, bis die Session wieder auf „nicht
              gestartet“ steht.
            </p>
            <ActionButton onClick={() => act('lobby', { action: 'liveLobby' })} disabled={busy}>
              Lobby öffnen
            </ActionButton>
          </>
        )}

        {phase === 'lobby' && (
          <>
            <TeamCounts state={state} />
            <ActionButton
              onClick={() => nextQuestion && act('start', { action: 'liveStart', questionId: nextQuestion.id })}
              disabled={busy || !nextQuestion}
            >
              {nextQuestion ? `Erste Frage starten (${short(nextQuestion)})` : 'Keine offene Frage mehr'}
            </ActionButton>
            <ActionButton variant="secondary" onClick={() => act('idle', { action: 'liveIdle' })} disabled={busy}>
              Doch noch nicht – zurück auf „nicht gestartet“
            </ActionButton>
          </>
        )}

        {phase === 'question' && (
          <ActionButton
            onClick={() => act('reveal', { action: 'liveReveal' })}
            disabled={busy}
            highlight={secondsLeft === 0}
          >
            Auflösen{secondsLeft === 0 ? ' – Zeit ist um' : ''}
          </ActionButton>
        )}

        {phase === 'reveal' && question?.type === 'either' && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="font-medium">Was sagen die Eltern?</p>
            <p className="text-[15px] text-[var(--muted)]">
              Voreingestellt ist die Antwort aus dem Vorgespräch. Sagen sie auf der Bühne etwas
              anderes, hier umstellen – die Punkte werden neu berechnet.
            </p>
            <div className="mt-3 flex gap-2">
              {question.options.map((o) => (
                <button
                  key={o}
                  type="button"
                  disabled={busy}
                  onClick={() => act('parents', { action: 'liveParents', answer: o })}
                  className={`min-h-[52px] flex-1 rounded-lg px-4 text-lg font-semibold ${
                    state.revealed === o
                      ? 'bg-[var(--accent)] text-white'
                      : 'border border-[var(--border)] bg-white'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'reveal' && (
          <>
            <ActionButton
              onClick={() => nextQuestion && act('start', { action: 'liveStart', questionId: nextQuestion.id })}
              disabled={busy || !nextQuestion}
            >
              {nextQuestion ? `Nächste Frage (${short(nextQuestion)})` : 'Alle Fragen gespielt'}
            </ActionButton>
            <ActionButton
              variant={nextQuestion ? 'secondary' : 'primary'}
              onClick={() => act('end', { action: 'liveEnd' })}
              disabled={busy || !state.migrationOk}
            >
              Runde beenden → Finale
            </ActionButton>
          </>
        )}

        {phase === 'ended' && (
          <>
            <p className="text-[15px] text-[var(--muted)]">
              Der Live-Bonus ist gespeichert. Folien für den Beamer:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {FINALE_SLIDES.map((slide) => (
                <button
                  key={slide.id}
                  type="button"
                  disabled={busy}
                  onClick={() => act('slide', { action: 'liveSlide', slide: slide.id })}
                  className={`min-h-[56px] rounded-lg px-4 font-semibold ${
                    session.question_id === slide.id
                      ? 'bg-[var(--accent)] text-white'
                      : 'border border-[var(--border)] bg-white'
                  }`}
                >
                  {slide.label}
                </button>
              ))}
            </div>
            <Standings state={state} />
          </>
        )}

        {(phase === 'question' || phase === 'reveal') && <Standings state={state} />}

        {error && <p className="text-[15px] text-red-700">{error}</p>}
      </section>

      {/* Fragenliste */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Alle Fragen</h2>
        <ol className="flex flex-col gap-2">
          {LIVE_QUESTIONS.map((q, i) => {
            const isCurrent = q.id === question?.id && phase !== 'ended';
            const done = played.includes(q.id) && !isCurrent;
            return (
              <li
                key={q.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                  isCurrent
                    ? 'border-[var(--accent)] bg-[var(--accent)]/8'
                    : done
                      ? 'border-[var(--border)] bg-[var(--border)]/40 text-[var(--muted)]'
                      : 'border-[var(--border)] bg-[var(--surface)]'
                }`}
              >
                <span className="w-6 shrink-0 text-[14px] tabular-nums text-[var(--muted)]">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] text-[var(--muted)]">
                    {typeLabel(q)}
                    {solutions[q.id] && <> · Lösung: {solutions[q.id]}</>}
                  </p>
                  <p className="truncate text-[15px]">{q.prompt}</p>
                </div>
                {!done && !isCurrent && phase !== 'idle' && phase !== 'question' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => act('start', { action: 'liveStart', questionId: q.id })}
                    className="min-h-[44px] shrink-0 rounded-lg border border-[var(--border)] bg-white px-3 text-[15px] font-medium"
                  >
                    Starten
                  </button>
                )}
                {done && <span className="shrink-0 text-[14px]">gespielt</span>}
                {isCurrent && <span className="shrink-0 text-[14px] font-semibold">läuft</span>}
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-[14px] text-[var(--muted)]">
          Antwortzeit {LIVE_SECONDS} s pro Frage. Eine gespielte Frage kann nicht erneut gestartet
          werden.
        </p>
      </section>

      {/* Links */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-[15px]">
        <p className="font-medium">Beamer</p>
        <p className="text-[var(--muted)]">
          Auf dem Laptop im selben Browser einfach{' '}
          <Link href="/screen/live" target="_blank" className="text-[var(--accent-strong)] underline">
            /screen/live
          </Link>{' '}
          öffnen. Auf einem anderen Gerät: <code>/screen/live?key=&lt;HOST_SECRET&gt;</code>.
        </p>
      </section>

      {/* Reset */}
      <section className="rounded-xl border border-red-300 bg-red-50 p-4">
        <p className="font-medium text-red-900">Live-Runde zurücksetzen</p>
        <p className="text-[15px] text-red-900">
          Löscht alle Live-Antworten und den Team-Bonus, Phase zurück auf „nicht gestartet“.
          Für den Test vor der Feier. Zum Bestätigen <strong>{RESET_PHRASE}</strong> eintippen.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            type="text"
            value={resetText}
            onChange={(e) => setResetText(e.target.value)}
            className="min-h-[48px] flex-1 rounded-lg border border-red-300 bg-white px-3"
          />
          <button
            type="button"
            disabled={busy || resetText !== RESET_PHRASE}
            onClick={() =>
              act('reset', { action: 'liveReset', confirm: resetText }).then(() => setResetText(''))
            }
            className="min-h-[48px] rounded-lg bg-red-700 px-4 font-medium text-white disabled:opacity-40"
          >
            Zurücksetzen
          </button>
        </div>
      </section>
    </div>
  );
}

function short(q: LiveQuestion): string {
  return `${typeLabel(q)} ${LIVE_QUESTIONS.indexOf(q) + 1}`;
}

function typeLabel(q: LiveQuestion): string {
  return q.type === 'quote' ? 'Zitat' : q.type === 'either' ? 'Wer eher' : 'Menti';
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant = 'primary',
  highlight = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[60px] w-full rounded-xl px-5 text-lg font-semibold transition disabled:opacity-40 ${
        variant === 'primary'
          ? highlight
            ? 'bg-red-700 text-white'
            : 'bg-[var(--accent)] text-white'
          : 'border border-[var(--border)] bg-white text-[var(--foreground)]'
      }`}
    >
      {children}
    </button>
  );
}

function TeamCounts({ state }: { state: ScreenPayload }) {
  return (
    <ul className="flex flex-col gap-1 text-[15px]">
      {state.teams.map((t) => (
        <li key={t.teamId} className="flex items-center gap-2 tabular-nums">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
          {t.name}: {state.participants.byTeam[t.teamId] ?? 0} dabei
        </li>
      ))}
    </ul>
  );
}

function Standings({ state }: { state: ScreenPayload }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="mb-2 text-[14px] text-[var(--muted)]">Live-Wertung (Ø je Teilnehmer:in, summiert)</p>
      <ul className="flex flex-col gap-1 text-[15px]">
        {state.teams.map((t) => (
          <li key={t.teamId} className="flex items-center justify-between tabular-nums">
            <span className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
              {t.rank}. {t.name}
            </span>
            <span>
              {t.total} P · Bonus {t.bonus}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
