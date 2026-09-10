import { NextResponse } from 'next/server';
import { GUEST_COOKIE, GUEST_COOKIE_MAX_AGE } from '@/lib/guest';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { Guest } from '@/lib/supabase/types';
import { teamById } from '@/content/teams';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let name: unknown;
  try {
    ({ name } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
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

  res.cookies.set(GUEST_COOKIE, guest.id, {
    path: '/',
    maxAge: GUEST_COOKIE_MAX_AGE,
    sameSite: 'lax',
    httpOnly: false, // der Client stellt den Cookie aus dem localStorage wieder her
  });

  return res;
}
