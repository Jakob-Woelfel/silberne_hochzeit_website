import { NextResponse } from 'next/server';
import { getGuestId } from '@/lib/guest';
import { supabaseAdmin } from '@/lib/supabase/server';
import { LIVE_JOIN_TASK } from '@/content/live';
import { loadSession } from '@/lib/live';

export const dynamic = 'force-dynamic';

/** Gast meldet sich in der Lobby – zählt ab dann als Teilnehmer:in seines Teams. */
export async function POST() {
  const guestId = await getGuestId();
  if (!guestId) {
    return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  }

  const session = await loadSession();
  if (session.phase === 'idle' || session.phase === 'ended') {
    return NextResponse.json({ ok: false, phase: session.phase });
  }

  const { error } = await supabaseAdmin()
    .from('answers')
    .upsert(
      { guest_id: guestId, task_id: LIVE_JOIN_TASK, value: { type: 'live_join' }, points: 0 },
      { ignoreDuplicates: true },
    );
  if (error) {
    console.error('live join failed', error);
    return NextResponse.json({ error: 'Anmeldung fehlgeschlagen.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, phase: session.phase });
}
