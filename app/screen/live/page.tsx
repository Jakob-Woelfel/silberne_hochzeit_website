import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isAdmin, keyMatches } from '@/lib/admin';
import { loadFinale, loadLiveState } from '@/lib/live';
import { LiveScreen } from '@/components/live/LiveScreen';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Live-Runde · Beamer',
  robots: { index: false, follow: false },
};

/**
 * Beamer. Zugang wie /admin: Cookie oder ?key=<HOST_SECRET>.
 * Der Key wird an den Client durchgereicht, damit das Polling ohne Cookie
 * funktioniert (z. B. auf einem zweiten Laptop).
 */
export default async function LiveScreenPage({ searchParams }: PageProps<'/screen/live'>) {
  const { key } = await searchParams;
  const keyParam = typeof key === 'string' ? key : null;
  const allowed = (await isAdmin()) || keyMatches(keyParam);
  if (!allowed) notFound();

  const state = await loadLiveState();
  const finale = state.session.phase === 'ended' ? await loadFinale() : null;

  return <LiveScreen initial={{ ...state, finale }} accessKey={keyMatches(keyParam) ? keyParam : null} />;
}
