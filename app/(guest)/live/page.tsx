import { redirect } from 'next/navigation';
import { getGuest } from '@/lib/guest';
import { loadLiveMe } from '@/lib/live';
import { teamById } from '@/content/teams';
import { LiveClient } from '@/components/live/LiveClient';

export const dynamic = 'force-dynamic';

export default async function LivePage() {
  const guest = await getGuest();
  if (!guest) redirect('/start');

  const me = await loadLiveMe(guest.id);
  const team = teamById(guest.team_id);

  return <LiveClient initial={me} teamName={team?.name ?? null} teamColor={team?.color ?? null} />;
}
