import { loadFinale, loadLiveState } from '@/lib/live';
import { LIVE_SOLUTIONS } from '@/content/live.solutions';
import { HostPanel } from '@/components/live/HostPanel';

export const dynamic = 'force-dynamic';

/** Host-Steuerung. Zugang über das Admin-Layout (HOST_SECRET). */
export default async function AdminLivePage() {
  const state = await loadLiveState();
  const finale = state.session.phase === 'ended' ? await loadFinale() : null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Live-Runde</h1>
        <p className="text-[15px] text-[var(--muted)]">
          Ablauf: Lobby öffnen → Frage starten → Auflösen → nächste Frage … → Runde beenden →
          Finale-Folien.
        </p>
      </div>
      <HostPanel initial={{ ...state, finale }} solutions={LIVE_SOLUTIONS} />
    </div>
  );
}
