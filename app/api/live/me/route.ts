import { NextResponse } from 'next/server';
import { getGuestId } from '@/lib/guest';
import { loadLiveMe } from '@/lib/live';

export const dynamic = 'force-dynamic';

/** Polling-Endpunkt für die Gäste-Handys, ergänzend zu Realtime. */
export async function GET() {
  const guestId = await getGuestId();
  if (!guestId) {
    return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  }
  const body = await loadLiveMe(guestId);
  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
}
