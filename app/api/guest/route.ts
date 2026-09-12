import { NextResponse } from 'next/server';
import { GUEST_COOKIE, GUEST_COOKIE_MAX_AGE } from '@/lib/guest';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { Guest } from '@/lib/supabase/types';
import { teamById } from '@/content/teams';

export const dynamic = 'force-dynamic';

function setGuestCookie(res: NextResponse, id: string) {
  res.cookies.set(GUEST_COOKIE, id, {
    path: '/',
    maxAge: GUEST_COOKIE_MAX_AGE,
    sameSite: 'lax',
    httpOnly: false, // der Client stellt den Cookie aus dem localStorage wieder her
  });
}

/** Gästeliste für „Ich war schon dabei“ (Kickoff 6.2). Nur Namen und Team. */
export async function GET() {
  const { data } = await supabaseAdmin()
    .from('guests')
    .select('id, name, team_id')
    .order('name', { ascending: true });
  const guests = ((data ?? []) as unknown as Pick<Guest, 'id' | 'name' | 'team_id'>[]).map((g) => ({
    id: g.id,
    name: g.name,
    team: teamById(g.team_id)?.name ?? null,
  }));
  return NextResponse.json({ guests }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  let name: unknown;
  let guestId: unknown;
  try {
    ({ name, guestId } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  // Wiedereinstieg: bestehende Identität übernehmen, nichts wird angelegt oder geändert.
  if (typeof guestId === 'string') {
    const { data } = await supabaseAdmin()
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .maybeSingle();
    const guest = data as unknown as Guest | null;
    if (!guest) {
      return NextResponse.json({ error: 'Gast nicht gefunden.' }, { status: 404 });
    }
    const team = teamById(guest.team_id);
    const res = NextResponse.json({
      id: guest.id,
      name: guest.name,
      team: team ? { id: team.id, name: team.name, color: team.color } : null,
    });
    setGuestCookie(res, guest.id);
    return res;
  }

  if (typeof name !== 'string') {
    return NextResponse.json({ error: 'Bitte gib deinen Namen ein.' }, { status: 400 });
  }

  const clean = name.trim().replace(/\s+/g, ' ');
  if (clean.length < 2 || clean.length > 40) {
    return NextResponse.json(
      { error: 'Der Name muss zwischen 2 und 40 Zeichen lang sein.' },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin().rpc('create_guest', { p_name: clean });

  if (error || !data) {
    console.error('create_guest failed', error);
    return NextResponse.json(
      { error: 'Anmeldung fehlgeschlagen. Bitte noch einmal versuchen.' },
      { status: 500 },
    );
  }

  const guest = (Array.isArray(data) ? data[0] : data) as Guest;
  const team = teamById(guest.team_id);

  const res = NextResponse.json({
    id: guest.id,
    name: guest.name,
    team: team ? { id: team.id, name: team.name, color: team.color } : null,
  });

  setGuestCookie(res, guest.id);
  return res;
}
