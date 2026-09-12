'use client';

import type { ScreenPayload } from '@/app/api/live/screen/route';
import { LIVE_SECONDS, liveHeading, type LiveQuestion } from '@/content/live';
import { teamById } from '@/content/teams';
import { useScreenState, useSecondsLeft } from './useScreenState';

/**
 * Beamer-Ansicht (Kickoff 4.4): keine Buttons, nur Anzeige. Dunkler Grund,
 * große Schrift – wird aus 10 m Entfernung gelesen.
 */
export function LiveScreen({ initial, accessKey }: { initial: ScreenPayload; accessKey: string | null }) {
  const { state, offset, error } = useScreenState(initial, accessKey, 1500);
  const secondsLeft = useSecondsLeft(state.deadline, offset);
  const phase = state.session.phase;

  return (
    <div className="flex min-h-screen flex-col bg-[#1c1917] px-10 py-8 text-white">
      <header className="flex items-baseline justify-between gap-6 text-white/60">
        <p className="text-2xl">Bernd &amp; Katrin · 25 Jahre</p>
        <p className="text-2xl">
          {phase === 'question' || phase === 'reveal'
            ? `Frage ${state.questionIndex + 1} von ${state.totalQuestions}`
            : phase === 'ended'
              ? 'Finale'
              : 'Live-Runde'}
        </p>
      </header>

      {error && <p className="mt-4 text-xl text-amber-300">{error}</p>}

      <main className="flex flex-1 flex-col justify-center py-8">
        {phase === 'idle' && <IdleScreen />}
        {phase === 'lobby' && <LobbyScreen state={state} />}
        {phase === 'question' && state.question && (
          <QuestionScreen state={state} question={state.question} secondsLeft={secondsLeft} />
        )}
        {phase === 'reveal' && state.question && <RevealScreen state={state} question={state.question} />}
        {phase === 'ended' && <FinaleScreen state={state} />}
      </main>

      {(phase === 'reveal' || phase === 'lobby') && <StandingsBar state={state} />}
    </div>
  );
}

function IdleScreen() {
  return (
    <div className="text-center">
      <p className="text-3xl text-white/60">Live-Runde</p>
      <h1 className="mt-4 text-7xl font-semibold leading-tight">Gleich geht’s los</h1>
      <p className="mt-8 text-3xl text-white/70">
        Handy raus, App öffnen – die Fragen erscheinen automatisch.
      </p>
    </div>
  );
}

function LobbyScreen({ state }: { state: ScreenPayload }) {
  return (
    <div className="text-center">
      <p className="text-3xl text-white/60">Schon dabei</p>
      <p className="mt-2 text-[12rem] font-semibold leading-none tabular-nums">{state.participants.total}</p>
      <div className="mx-auto mt-10 grid max-w-4xl grid-cols-3 gap-6">
        {state.teams
          .slice()
          .sort((a, b) => a.teamId - b.teamId)
          .map((t) => (
            <div key={t.teamId} className="rounded-3xl p-6" style={{ backgroundColor: t.color }}>
              <p className="text-2xl font-semibold">{t.name}</p>
              <p className="mt-1 text-5xl font-semibold tabular-nums">
                {state.participants.byTeam[t.teamId] ?? 0}
              </p>
            </div>
          ))}
      </div>
      <p className="mt-10 text-3xl text-white/70">Öffne auf dem Handy „Live-Runde“ – dann bist du drin.</p>
    </div>
  );
}

function Prompt({ question }: { question: LiveQuestion }) {
  return (
    <div className="text-center">
      <p className="text-3xl uppercase tracking-wide text-white/60">{liveHeading(question)}</p>
      <h1
        className={`mx-auto mt-4 max-w-6xl font-semibold leading-tight ${
          question.prompt.length > 90 ? 'text-5xl' : 'text-6xl'
        }`}
      >
        {question.type === 'quote' ? `„${question.prompt}“` : question.prompt}
      </h1>
    </div>
  );
}

function QuestionScreen({
  state,
  question,
  secondsLeft,
}: {
  state: ScreenPayload;
  question: LiveQuestion;
  secondsLeft: number | null;
}) {
  const answered = state.answered.total;
  const total = Math.max(state.participants.total, answered, 1);
  const progress = (secondsLeft ?? 0) / LIVE_SECONDS;

  return (
    <div className="flex flex-col items-center gap-12">
      <Prompt question={question} />

      <div className="flex w-full max-w-5xl items-center justify-between gap-10">
        {question.type !== 'menti' ? (
          <div className="flex flex-1 gap-6">
            {question.options.map((o) => (
              <div
                key={o}
                className="flex-1 rounded-3xl border-4 border-white/30 py-10 text-center text-6xl font-semibold"
              >
                {o}
              </div>
            ))}
          </div>
        ) : (
          <p className="flex-1 text-center text-4xl text-white/70">Alle tippen gerade auf dem Handy …</p>
        )}

        <div
          className="relative flex h-48 w-48 shrink-0 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(${secondsLeft !== null && secondsLeft <= 5 ? '#dc2626' : '#f5f0e8'} ${
              progress * 360
            }deg, rgba(255,255,255,0.12) 0deg)`,
          }}
        >
          <div className="flex h-40 w-40 items-center justify-center rounded-full bg-[#1c1917]">
            <span className="text-7xl font-semibold tabular-nums">
              {secondsLeft === null ? '…' : secondsLeft}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl">
        <div className="h-4 w-full overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-white/80 transition-all duration-500"
            style={{ width: `${Math.min(100, (answered / total) * 100)}%` }}
          />
        </div>
        <p className="mt-3 text-center text-3xl text-white/70 tabular-nums">
          {answered} von {state.participants.total} haben geantwortet
        </p>
      </div>
    </div>
  );
}

function RevealScreen({ state, question }: { state: ScreenPayload; question: LiveQuestion }) {
  if (question.type === 'menti') return <MentiScreen state={state} question={question} />;

  const total = Math.max(1, state.options.reduce((s, o) => s + o.total, 0));
  const revealed = state.revealed;

  return (
    <div className="flex flex-col items-center gap-10">
      <Prompt question={question} />

      <div className="w-full max-w-5xl">
        <p className="mb-4 text-center text-3xl text-white/60">
          {question.type === 'quote' ? 'Geschrieben hat das …' : 'Die Eltern sagen …'}
        </p>
        <div className="flex gap-6">
          {state.options.map((o) => {
            const hit = o.option === revealed;
            const pct = Math.round((o.total / total) * 100);
            return (
              <div
                key={o.option}
                className={`flex-1 rounded-3xl border-4 p-6 ${
                  hit ? 'border-green-400 bg-green-400/15' : 'border-white/20 opacity-70'
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <p className="text-6xl font-semibold">{o.option}</p>
                  <p className="text-5xl font-semibold tabular-nums">{pct} %</p>
                </div>
                <div className="mt-4 flex h-6 w-full overflow-hidden rounded-full bg-white/10">
                  {state.teams
                    .slice()
                    .sort((a, b) => a.teamId - b.teamId)
                    .map((t) => (
                      <div
                        key={t.teamId}
                        style={{
                          width: `${((o.byTeam[t.teamId] ?? 0) / total) * 100}%`,
                          backgroundColor: t.color,
                        }}
                      />
                    ))}
                </div>
                <p className="mt-2 text-2xl text-white/60 tabular-nums">
                  {o.total} {o.total === 1 ? 'Stimme' : 'Stimmen'} ·{' '}
                  {state.teams
                    .slice()
                    .sort((a, b) => a.teamId - b.teamId)
                    .map((t) => `${t.name} ${o.byTeam[t.teamId] ?? 0}`)
                    .join(' · ')}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MentiScreen({ state, question }: { state: ScreenPayload; question: LiveQuestion }) {
  const max = Math.max(1, ...state.words.map((w) => w.count));
  return (
    <div className="flex flex-col items-center gap-10">
      <Prompt question={question} />
      {state.words.length === 0 ? (
        <p className="text-4xl text-white/60">Noch keine Antworten.</p>
      ) : (
        <div className="flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {state.words.map((w, i) => {
            const scale = 1 + (w.count / max) * 2.2;
            const team = teamById((i % 3) + 1);
            return (
              <span
                key={w.text}
                className="font-semibold leading-none"
                style={{
                  fontSize: `${scale * 1.5}rem`,
                  color: w.count === max ? '#ffffff' : (team?.color ?? '#fff'),
                  opacity: 0.6 + (w.count / max) * 0.4,
                }}
              >
                {w.text}
                {w.count > 1 && <span className="ml-1 text-[0.5em] text-white/60">×{w.count}</span>}
              </span>
            );
          })}
        </div>
      )}
      <p className="text-3xl text-white/60 tabular-nums">{state.answered.total} Antworten</p>
    </div>
  );
}

function StandingsBar({ state }: { state: ScreenPayload }) {
  return (
    <footer className="mt-6 flex items-center justify-center gap-10 border-t border-white/10 pt-6 text-3xl">
      {state.teams.map((t) => (
        <span key={t.teamId} className="flex items-center gap-3 tabular-nums">
          <span className="inline-block h-5 w-5 rounded-full" style={{ backgroundColor: t.color }} />
          <span className="text-white/70">{t.name}</span>
          <span className="font-semibold">{t.total}</span>
        </span>
      ))}
    </footer>
  );
}

function FinaleScreen({ state }: { state: ScreenPayload }) {
  const slide = state.session.question_id ?? 'final_live';
  const finale = state.finale;

  if (slide === 'final_gift') {
    return (
      <div className="text-center">
        <p className="text-4xl text-white/60">Und jetzt …</p>
        <h1 className="mt-6 text-8xl font-semibold leading-tight">Das Geschenk</h1>
        <p className="mt-10 text-4xl text-white/70">Bernd und Katrin, bitte nach vorne.</p>
      </div>
    );
  }

  if (slide === 'final_team') {
    const rows = finale?.teamRanking ?? [];
    const top = rows[0]?.points ?? 1;
    return (
      <div className="mx-auto w-full max-w-5xl">
        <p className="text-center text-4xl text-white/60">Team-Wertung</p>
        <h1 className="mt-2 text-center text-7xl font-semibold">
          {rows[0] ? `${rows[0].name} gewinnt!` : 'Team-Sieger'}
        </h1>
        <ol className="mt-12 flex flex-col gap-6">
          {rows.map((t, i) => (
            <li key={t.id} className="flex items-center gap-6">
              <span className="w-16 text-5xl font-semibold tabular-nums text-white/60">{i + 1}.</span>
              <div className="flex-1">
                <div className="flex items-baseline justify-between text-5xl">
                  <span className="font-semibold">{t.name}</span>
                  <span className="tabular-nums">{t.points} P</span>
                </div>
                <div className="mt-3 h-8 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(4, (t.points / Math.max(1, top)) * 100)}%`, backgroundColor: t.color }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-center text-3xl text-white/60">Selfie-Bingo + Bonus aus der Live-Runde</p>
      </div>
    );
  }

  if (slide === 'final_solo') {
    const rows = finale?.soloTop ?? [];
    return (
      <div className="mx-auto w-full max-w-5xl">
        <p className="text-center text-4xl text-white/60">Solo-Wertung · Level 1–3</p>
        <h1 className="mt-2 text-center text-7xl font-semibold">
          {rows[0] ? `${rows[0].name}!` : 'Solo-Sieger'}
        </h1>
        <ol className="mt-12 grid grid-cols-2 gap-x-16 gap-y-4">
          {rows.map((r, i) => {
            const team = teamById(r.team_id);
            return (
              <li
                key={r.id}
                className={`flex items-center gap-5 rounded-2xl px-5 py-3 ${
                  i === 0 ? 'bg-white/15 text-5xl' : 'text-4xl'
                }`}
              >
                <span className="w-14 tabular-nums text-white/60">{r.rank}.</span>
                <span
                  className="inline-block h-5 w-5 shrink-0 rounded-full"
                  style={{ backgroundColor: team?.color ?? '#888' }}
                />
                <span className="flex-1 truncate font-semibold">{r.name}</span>
                <span className="tabular-nums">{r.points}</span>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  // final_live
  return (
    <div className="mx-auto w-full max-w-5xl">
      <p className="text-center text-4xl text-white/60">Live-Runde</p>
      <h1 className="mt-2 text-center text-7xl font-semibold">
        {state.teams[0] ? `${state.teams[0].name} vorne!` : 'Ergebnis'}
      </h1>
      <ol className="mt-12 flex flex-col gap-6">
        {state.teams.map((t) => (
          <li key={t.teamId} className="flex items-center gap-6 rounded-3xl p-6" style={{ backgroundColor: `${t.color}33` }}>
            <span className="w-16 text-5xl font-semibold tabular-nums">{t.rank}.</span>
            <span className="inline-block h-8 w-8 rounded-full" style={{ backgroundColor: t.color }} />
            <span className="flex-1 text-5xl font-semibold">{t.name}</span>
            <span className="text-4xl tabular-nums text-white/80">{t.total} P</span>
            <span className="rounded-full bg-white/15 px-5 py-2 text-4xl font-semibold tabular-nums">
              +{t.bonus} Bonus
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-center text-3xl text-white/60">
        Punkte = Durchschnitt pro Teammitglied, über alle Fragen summiert
      </p>
    </div>
  );
}
