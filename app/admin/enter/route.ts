import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE, keyMatches } from '@/lib/admin';

export const dynamic = 'force-dynamic';

/**
 * Bequemer Einstieg: /admin/enter?key=... legt den Schluessel als Cookie ab
 * und leitet auf das Dashboard weiter. Danach reicht /admin.
 */
export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('key');
  const target = new URL('/admin', request.url);

  if (!keyMatches(key)) {
    target.searchParams.set('fehler', '1');
    return NextResponse.redirect(target);
  }

  const res = NextResponse.redirect(target);
  res.cookies.set(ADMIN_COOKIE, key!, {
    path: '/',
    maxAge: ADMIN_COOKIE_MAX_AGE,
    sameSite: 'lax',
    httpOnly: true,
  });
  return res;
}
