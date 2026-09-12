import { NextResponse } from 'next/server';
import { isAdmin, keyMatches } from '@/lib/admin';
import { loadFinale, loadLiveState, type FinaleData, type LiveState } from '@/lib/live';

export const dynamic = 'force-dynamic';

export type ScreenPayload = LiveState & { finale: FinaleData | null };

/**
 * Zustand für Beamer und Host-Panel. Enthält Verteilungen und (im Finale)
 * das volle Solo-Ranking – deshalb nur mit Admin-Cookie oder ?key=.
 */
export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('key');
  if (!(await isAdmin()) && !keyMatches(key)) {
    return NextResponse.json({ error: 'Kein Zugang.' }, { status: 401 });
  }

  const state = await loadLiveState();
  const finale = state.session.phase === 'ended' ? await loadFinale() : null;
  const body: ScreenPayload = { ...state, finale };
  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
}
