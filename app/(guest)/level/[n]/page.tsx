import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { LEVELS, isLevelNumber } from '@/content/levels';
import { unlockTimestamp, type ModuleKey } from '@/content/schedule';
import { isModuleOpen } from '@/lib/unlock';
import { isAdminPreview } from '@/lib/admin';
import { getAnswersForPrefix, getGuest } from '@/lib/guest';
import { Countdown } from '@/components/ui/Countdown';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LevelPlayer, type SavedAnswer } from '@/components/questions/LevelPlayer';
import type { AnswerValue } from '@/content/types';

export const dynamic = 'force-dynamic';

export default async function LevelPage({ params }: PageProps<'/level/[n]'>) {
  const { n } = await params;
  const num = Number(n);
  if (!isLevelNumber(num)) notFound();

  const guest = await getGuest();
  if (!guest) redirect('/start');

  const level = LEVELS[num];
  const key = `l${num}` as ModuleKey;

  if (!isModuleOpen(key) && !(await isAdminPreview())) {
    const target = unlockTimestamp(key);
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-semibold">{level.title}</h1>
        <Card>
          <p className="text-[var(--muted)]">Dieses Level ist noch geschlossen.</p>
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

  if (level.questions.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-semibold">{level.title}</h1>
        <Card>
          <p className="text-[var(--muted)]">
            Die Fragen für dieses Level kommen noch.
          </p>
        </Card>
        <Link href="/home" className="block">
          <Button variant="secondary">Zurück zur Übersicht</Button>
        </Link>
      </div>
    );
  }

  const stored = await getAnswersForPrefix(guest.id, `l${num}_`);
  const saved: Record<string, SavedAnswer> = {};
  for (const [taskId, row] of Object.entries(stored)) {
    saved[taskId] = { value: row.value as AnswerValue, points: row.points };
  }

  return <LevelPlayer title={level.title} questions={level.questions} saved={saved} />;
}
