import 'server-only';

import { supabaseAdmin } from '@/lib/supabase/server';
import {
  LIVE_BONUS,
  LIVE_JOIN_TASK,
  LIVE_QUESTIONS,
  LIVE_SECONDS,
  liveQuestionById,
  type LiveQuestion,
} from '@/content/live';
import { TEAMS } from '@/content/teams';
import {
  liveBonusForRank,
  liveTeamScores,
  normalizeText,
  rankTeams,
  type LiveAnswerRow,
  type LiveTeamScore,
} from '@/lib/scoring';
import type { AnswerValue } from '@/content/types';
import type { SessionRow, SoloRankingRow, TeamRankingRow } from '@/lib/supabase/types';

/** Alles rund um die Live-Session, nur Server. Lösungen kommen hier nicht vor. */

export const LIVE_ACTIVE_PHASES: SessionRow['phase'][] = ['lobby', 'question', 'reveal'];

export async function loadSession(): Promise<SessionRow> {
  const { data } = await supabaseAdmin().from('session').select('*').eq('id', 1).maybeSingle();
  return (
    (data as unknown as SessionRow | null) ?? {
      id: 1,
      phase: 'idle',
      question_id: null,
      started_at: null,
      parents_answer: null,
      updated_at: new Date(0).toISOString(),
    }
  );
}

/**
 * Sobald der Host die Lobby öffnet, sind Level und Bingo zu (Kickoff 4.1):
 * die Team-Wertung muss vor der Live-Runde feststehen.
 */
export async function liveHasStarted(): Promise<boolean> {
  const session = await loadSession();
  return session.phase !== 'idle';
}

/** Elternantwort bzw. richtige Antwort aus der session-Zeile. */
export function revealedAnswer(session: SessionRow): string | null {
  const pa = session.parents_answer as { answer?: unknown } | null;
  return pa && typeof pa.answer === 'string' ? pa.answer : null;
}

type RawAnswer = {
  guest_id: string;
  task_id: string;
  value: AnswerValue;
  points: number;
  answered_at: string;
};

type GuestLite = { id: string; name: string; team_id: number | null };

async function loadLiveRows(): Promise<{ guests: GuestLite[]; answers: RawAnswer[] }> {
  const db = supabaseAdmin();
  const [g, a] = await Promise.all([
    db.from('guests').select('id, name, team_id'),
    db.from('answers').select('guest_id, task_id, value, points, answered_at').like('task_id', 'live_%'),
  ]);
  return {
    guests: (g.data ?? []) as unknown as GuestLite[],
    answers: (a.data ?? []) as unknown as RawAnswer[],
  };
}

function toRows(answers: RawAnswer[], teamOf: Map<string, number | null>): LiveAnswerRow[] {
  return answers
    .filter((a) => a.task_id !== LIVE_JOIN_TASK)
    .map((a) => ({
      guestId: a.guest_id,
      teamId: teamOf.get(a.guest_id) ?? null,
      taskId: a.task_id,
      option: a.value.type === 'live' ? a.value.option : null,
      points: a.points,
    }));
}

/** Wer zählt als dabei: in der Lobby angekommen oder irgendetwas getippt. */
function participantsOf(answers: RawAnswer[], teamOf: Map<string, number | null>) {
  const ids = new Set(answers.map((a) => a.guest_id));
  return [...ids].map((guestId) => ({ guestId, teamId: teamOf.get(guestId) ?? null }));
}

export type OptionStat = {
  option: string;
  total: number;
  byTeam: Record<number, number>;
};

export type MentiWord = { text: string; count: number };

export type LiveTeamView = LiveTeamScore & { name: string; color: string; rank: number; bonus: number };

export type LiveState = {
  session: SessionRow;
  question: LiveQuestion | null;
  questionIndex: number;
  totalQuestions: number;
  /** Zeitpunkt, an dem die Antwortzeit abläuft (ms, Serverzeit) */
  deadline: number | null;
  serverNow: number;
  /** Antwort, die gerade aufgedeckt ist (nur in Phase reveal gesetzt) */
  revealed: string | null;
  participants: { total: number; byTeam: Record<number, number> };
  /** wie viele haben die aktuelle Frage beantwortet */
  answered: { total: number; byTeam: Record<number, number> };
  options: OptionStat[];
  words: MentiWord[];
  teams: LiveTeamView[];
  /** Fragen, zu denen schon Antworten vorliegen (können nicht erneut gestartet werden) */
  played: string[];
  /** Tabelle team_bonus aus 0003_live.sql vorhanden? */
  migrationOk: boolean;
};

/** Kompletter Zustand für Beamer und Host. Nur hinter isAdmin() ausliefern. */
export async function loadLiveState(): Promise<LiveState> {
  const [session, { guests, answers }, migrationOk] = await Promise.all([
    loadSession(),
    loadLiveRows(),
    liveMigrationApplied(),
  ]);
  const teamOf = new Map(guests.map((g) => [g.id, g.team_id]));
  const question = liveQuestionById(session.question_id) ?? null;
  const questionIndex = question ? LIVE_QUESTIONS.findIndex((q) => q.id === question.id) : -1;

  const participants = participantsOf(answers, teamOf);
  const byTeam = (ids: { teamId: number | null }[]) => {
    const map: Record<number, number> = {};
    for (const t of TEAMS) map[t.id] = 0;
    for (const p of ids) if (p.teamId !== null) map[p.teamId] = (map[p.teamId] ?? 0) + 1;
    return map;
  };

  const current = question ? answers.filter((a) => a.task_id === question.id) : [];
  const currentRows = current.map((a) => ({ teamId: teamOf.get(a.guest_id) ?? null }));

  const options: OptionStat[] = [];
  const words: MentiWord[] = [];
  if (question && question.type !== 'menti') {
    for (const option of question.options) {
      const hits = current.filter((a) => a.value.type === 'live' && a.value.option === option);
      options.push({
        option,
        total: hits.length,
        byTeam: byTeam(hits.map((a) => ({ teamId: teamOf.get(a.guest_id) ?? null }))),
      });
    }
  }
  if (question && question.type === 'menti') {
    const counts = new Map<string, MentiWord>();
    for (const a of current) {
      if (a.value.type !== 'live_text') continue;
      const key = normalizeText(a.value.text);
      if (!key) continue;
      const entry = counts.get(key) ?? { text: a.value.text.trim(), count: 0 };
      entry.count += 1;
      counts.set(key, entry);
    }
    words.push(...[...counts.values()].sort((a, b) => b.count - a.count));
  }

  // Gewertet werden alle Fragen, die nicht gerade laufen: bis zur Auflösung
  // darf die Verteilung der laufenden Frage die Wertung nicht verraten.
  const scoredIds = LIVE_QUESTIONS.filter(
    (q) => q.type !== 'menti' && !(session.phase === 'question' && q.id === session.question_id),
  ).map((q) => q.id);
  const scores = liveTeamScores(
    TEAMS.map((t) => t.id),
    participants,
    toRows(answers, teamOf),
    scoredIds,
  );
  const ranks = rankTeams(scores);
  const teams: LiveTeamView[] = scores
    .map((s) => {
      const meta = TEAMS.find((t) => t.id === s.teamId)!;
      const rank = ranks.get(s.teamId) ?? TEAMS.length;
      return {
        ...s,
        name: meta.name,
        color: meta.color,
        rank,
        bonus: liveBonusForRank(rank, LIVE_BONUS),
      };
    })
    .sort((a, b) => a.rank - b.rank);

  const startedAt = session.started_at ? Date.parse(session.started_at) : null;
  const deadline =
    session.phase === 'question' && startedAt !== null ? startedAt + LIVE_SECONDS * 1000 : null;

  return {
    session,
    question,
    questionIndex,
    totalQuestions: LIVE_QUESTIONS.length,
    deadline,
    serverNow: Date.now(),
    revealed: session.phase === 'reveal' ? revealedAnswer(session) : null,
    participants: { total: participants.length, byTeam: byTeam(participants) },
    answered: { total: current.length, byTeam: byTeam(currentRows) },
    options,
    words,
    teams,
    played: LIVE_QUESTIONS.filter((q) => answers.some((a) => a.task_id === q.id)).map((q) => q.id),
    migrationOk,
  };
}

export type LiveMe = {
  session: Pick<SessionRow, 'phase' | 'question_id' | 'started_at'>;
  /** Ende der Antwortzeit in Serverzeit (ms) */
  deadline: number | null;
  serverNow: number;
  /** aufgedeckte Antwort (nur in Phase reveal) */
  revealed: string | null;
  /** wie viele Gäste sind dabei */
  joined: number;
  /** eigene Antworten; Punkte fehlen, solange die Frage noch läuft */
  mine: Record<string, { value: AnswerValue; points?: number }>;
};

/**
 * Sicht eines Gasts auf die Live-Runde. Liefert nie Lösungen – nur, was die
 * session-Zeile ohnehin verrät, plus die eigenen Antworten.
 */
export async function loadLiveMe(guestId: string): Promise<LiveMe> {
  const db = supabaseAdmin();
  const [session, mineRes, joinedRes] = await Promise.all([
    loadSession(),
    db.from('answers').select('task_id, value, points').eq('guest_id', guestId).like('task_id', 'live_%'),
    db.from('answers').select('guest_id', { count: 'exact', head: true }).eq('task_id', LIVE_JOIN_TASK),
  ]);

  const mine: LiveMe['mine'] = {};
  for (const row of (mineRes.data ?? []) as unknown as RawAnswer[]) {
    if (row.task_id === LIVE_JOIN_TASK) continue;
    const running = session.phase === 'question' && session.question_id === row.task_id;
    mine[row.task_id] = running ? { value: row.value } : { value: row.value, points: row.points };
  }

  const startedAt = session.started_at ? Date.parse(session.started_at) : null;
  return {
    session: { phase: session.phase, question_id: session.question_id, started_at: session.started_at },
    deadline: session.phase === 'question' && startedAt !== null ? startedAt + LIVE_SECONDS * 1000 : null,
    serverNow: Date.now(),
    revealed: session.phase === 'reveal' ? revealedAnswer(session) : null,
    joined: joinedRes.count ?? 0,
    mine,
  };
}

/** Live-Wertung festschreiben: Bonus je Team in team_bonus. */
export async function writeLiveBonus(): Promise<{ error: string | null; teams: LiveTeamView[] }> {
  const state = await loadLiveState();
  const db = supabaseAdmin();
  const rows = state.teams.map((t) => ({
    team_id: t.teamId,
    points: t.bonus,
    note: `Live-Runde: Platz ${t.rank} mit ${t.total} Punkten`,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await db.from('team_bonus').upsert(rows);
  return { error: error ? error.message : null, teams: state.teams };
}

/** Punkte einer „Wer würde eher“-Frage nach der Elternantwort neu setzen. */
export async function rescoreEither(questionId: string, answer: string, points: number) {
  const db = supabaseAdmin();
  const { data } = await db
    .from('answers')
    .select('guest_id, value')
    .eq('task_id', questionId);
  const rows = (data ?? []) as unknown as { guest_id: string; value: AnswerValue }[];
  await Promise.all(
    rows.map((r) =>
      db
        .from('answers')
        .update({
          points:
            r.value.type === 'live' && normalizeText(r.value.option) === normalizeText(answer)
              ? points
              : 0,
        })
        .eq('guest_id', r.guest_id)
        .eq('task_id', questionId),
    ),
  );
}

/** Existiert die Tabelle aus 0003_live.sql? Für die Warnung im Host-Panel. */
export async function liveMigrationApplied(): Promise<boolean> {
  // HEAD-Anfragen melden fehlende Tabellen nicht, deshalb ein echter Select.
  const { error } = await supabaseAdmin().from('team_bonus').select('team_id').limit(1);
  return !error;
}

export type FinaleData = {
  teamRanking: TeamRankingRow[];
  soloTop: SoloRankingRow[];
};

export async function loadFinale(): Promise<FinaleData> {
  const db = supabaseAdmin();
  const [t, s] = await Promise.all([
    db.from('team_ranking').select('*').order('points', { ascending: false }),
    db.from('solo_ranking').select('*').order('rank', { ascending: true }).limit(10),
  ]);
  return {
    teamRanking: (t.data ?? []) as unknown as TeamRankingRow[],
    soloTop: (s.data ?? []) as unknown as SoloRankingRow[],
  };
}
