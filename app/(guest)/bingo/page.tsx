import Link from 'next/link';
import { redirect } from 'next/navigation';
import { bingoFieldsFor } from '@/content/bingo';
import { unlockTimestamp } from '@/content/schedule';
import { isModuleOpen } from '@/lib/unlock';
import { isAdminPreview } from '@/lib/admin';
import { liveHasStarted } from '@/lib/live';
import { getGuest } from '@/lib/guest';
import { loadBingoState } from '@/lib/bingo';
import { Countdown } from '@/components/ui/Countdown';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BingoGrid } from '@/components/bingo/BingoGrid';

export const dynamic = 'force-dynamic';

export default async function BingoPage() {
  const guest = await getGuest();
  if (!guest) redirect('/start');

  const preview = await isAdminPreview();
  const open = isModuleOpen('bingo') || preview;

  if (!open) {
    const target = unlockTimestamp('bingo');
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-semibold">Selfie-Bingo</h1>
        <Card>
          <p className="text-[var(--muted)]">Das Bingo ist noch geschlossen.</p>
          {target && (
            <p className="mt-2 text-3xl font-semibold">
              <Countdown target={target} fallback="…" />
            </p>
          )}
        </Card>
        <Link href="/home" className="block">
          <Button variant="secondary">Zurück zur Übersicht</Button>
        </Link>
      </div>
    );
  }

  const state = await loadBingoState(guest.id);
  // Mit der Live-Runde steht die Team-Wertung fest (Kickoff 4.1).
  const closed = !preview && (await liveHasStarted());

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Selfie-Bingo</h1>
        <p className="text-[var(--muted)]">
          {closed
            ? 'Das Bingo ist seit Beginn der Live-Runde geschlossen. Danke fürs Mitmachen!'
            : 'Finde die passenden Leute, mach ein Selfie – jedes Feld zählt für dein Team.'}
        </p>
      </div>
      <BingoGrid fields={bingoFieldsFor(guest.id)} initial={state} open={open && !closed} />
    </div>
  );
}
