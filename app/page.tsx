import { redirect } from 'next/navigation';
import { getGuestId } from '@/lib/guest';

export const dynamic = 'force-dynamic';

/** Einstieg per QR-Code: bekannter Gast -> /home, sonst -> /start. */
export default async function Entry() {
  const guestId = await getGuestId();
  redirect(guestId ? '/home' : '/start');
}
