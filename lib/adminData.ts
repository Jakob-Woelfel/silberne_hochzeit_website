import 'server-only';

import { supabaseAdmin } from '@/lib/supabase/server';
import { LEVELS, LEVEL_NUMBERS } from '@/content/levels';
import { SOLUTIONS } from '@/content/levels.solutions';
import { maxPoints } from '@/lib/scoring';
import { TEAMS } from '@/content/teams';
import { UNLOCK_TIMES, unlockTimestamp, type ModuleKey } from '@/content/schedule';
import { unlockAll } from '@/lib/unlock';
import type { Guest, SoloRankingRow, TeamRankingRow } from '@/lib/supabase/types';

/** Alles, was das Admin-Dashboard anzeigt. Nur Server. */

export type ContentCheck = {
  level: number;
  title: string;
  questions: number;
  withSolution: number;
  missingSolutions: string[];
  placeholders: string[];
  maxPoints: number;
  types: Record<string, number>;
};

export function checkContent(): ContentCheck[] {
  return LEVEL_NUMBERS.map((n) => {
    const level = LEVELS[n];
    const missing: string[] = [];
    const placeholders: string[] = [];
    const types: Record<string, number> = {};
    let points = 0;

    for (const q of level.questions) {
      types[q.type] = (types[q.type] ?? 0) + 1;
      const solution = SOLUTIONS[q.id];
      if (!solution) missing.push(q.id);
      else points += maxPoints(solution);
      if (/PLATZHALTER/i.test(q.prompt)) placeholders.push(q.id);
    }

    return {
      level: n,
      title: level.title,
      questions: level.questions.length,
      withSolution: level.questions.length - missing.length,
      missingSolutions: missing,
      placeholders,
      maxPoints: points,
      types,
    };
  });
}

/** Lösungen ohne passende Frage – typischer Fehler beim Einpflegen. */
export function orphanSolutions(): string[] {
  const known = new Set(LEVEL_NUMBERS.flatMap((n) => LEVELS[n].questions.map((q) => q.id)));
  return Object.keys(SOLUTIONS).filter((id) => !known.has(id));
}

export type ModuleStatus = {
  key: ModuleKey;
  label: string;
  time: string | null;
  unlockAt: number | null;
  open: boolean;
};

export function moduleStatus(previewOpen = false, now = Date.now()): ModuleStatus[] {
  const labels: Record<ModuleKey, string> = {
    l1: 'Level 1',
    l2: 'Level 2',
    l3: 'Level 3',
    bingo: 'Selfie-Bingo',
    live: 'Live-Runde',
  };

  return (Object.keys(labels) as ModuleKey[]).map((key) => {
    const unlockAt = unlockTimestamp(key);
    const open =
      previewOpen || unlockAll() || (unlockAt !== null && now >= unlockAt);
    return { key, label: labels[key], time: UNLOCK_TIMES[key], unlockAt, open };
  });
}

export type AdminGuest = Guest & {
  points: number;
  rank: number;
  answers: number;
  teamName: string;
  teamColor: string;
};

export type Overview = {
  guests: AdminGuest[];
  teams: TeamRankingRow[];
  totals: { guests: number; answers: number; uploads: number; points: number };
};

export async function loadOverview(): Promise<Overview> {
  const db = supabaseAdmin();

  const [solo, teamRows, answerRows, uploadCount, guestRows] = await Promise.all([
    db.from('solo_ranking').select('*'),
    db.from('team_ranking').select('*').order('points', { ascending: false }),
    db.from('answers').select('guest_id, points'),
    db.from('uploads').select('id', { count: 'exact', head: true }),
    db.from('guests').select('*').order('seq', { ascending: true }),
  ]);

  const soloById = new Map(
    ((solo.data ?? []) as unknown as SoloRankingRow[]).map((r) => [r.id, r]),
  );

  const answersByGuest = new Map<string, number>();
  let totalPoints = 0;
  for (const row of (answerRows.data ?? []) as unknown as {
    guest_id: string;
    points: number;
  }[]) {
    answersByGuest.set(row.guest_id, (answersByGuest.get(row.guest_id) ?? 0) + 1);
    totalPoints += row.points;
  }

  const guests = ((guestRows.data ?? []) as unknown as Guest[]).map((g) => {
    const team = TEAMS.find((t) => t.id === g.team_id);
    const s = soloById.get(g.id);
    return {
      ...g,
      points: s?.points ?? 0,
      rank: s?.rank ?? 0,
      answers: answersByGuest.get(g.id) ?? 0,
      teamName: team?.name ?? '–',
      teamColor: team?.color ?? '#999999',
    };
  });

  return {
    guests,
    teams: (teamRows.data ?? []) as unknown as TeamRankingRow[],
    totals: {
      guests: guests.length,
      answers: (answerRows.data ?? []).length,
      uploads: uploadCount.count ?? 0,
      points: totalPoints,
    },
  };
}

export type AdminAnswer = {
  task_id: string;
  value: unknown;
  points: number;
  answered_at: string;
};

export async function loadGuestDetail(
  id: string,
): Promise<{ guest: Guest | null; answers: AdminAnswer[] }> {
  const db = supabaseAdmin();
  const [{ data: guest }, { data: answers }] = await Promise.all([
    db.from('guests').select('*').eq('id', id).maybeSingle(),
    db.from('answers').select('task_id, value, points, answered_at').eq('guest_id', id),
  ]);

  const rows = ((answers ?? []) as unknown as AdminAnswer[]).sort((a, b) =>
    a.task_id.localeCompare(b.task_id),
  );

  return { guest: (guest as unknown as Guest) ?? null, answers: rows };
}

/** Erreichbarkeit der Datenbank, fuer die Statuszeile. */
export async function pingDatabase(): Promise<{ ok: boolean; message: string }> {
  try {
    const { error } = await supabaseAdmin()
      .from('teams')
      .select('id', { count: 'exact', head: true });
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: 'verbunden' };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'unbekannter Fehler' };
  }
}
