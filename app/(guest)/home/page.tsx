import { getAllAnswers, getGuest } from '@/lib/guest';
import { LEVELS, LEVEL_NUMBERS } from '@/content/levels';
import { BINGO_SIZE, bingoFieldsFor } from '@/content/bingo';
import { unlockTimestamp } from '@/content/schedule';
import { isModuleOpen } from '@/lib/unlock';
import { isFinalAnswer } from '@/lib/scoring';
import { isAdminPreview } from '@/lib/admin';
import { Tile, type TileState } from '@/components/tiles/Tile';
import { redirect } from 'next/navigation';
import type { AnswerValue } from '@/content/types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const guest = await getGuest();
  if (!guest) redirect('/start');

  const answers = await getAllAnswers(guest.id);
  const preview = await isAdminPreview();

  const levelTiles = LEVEL_NUMBERS.map((n) => {
    const level = LEVELS[n];
    const key = `l${n}` as const;
    const total = level.questions.length;
    // halb geratene Zoom-Fragen zählen noch nicht als erledigt
    const answered = level.questions.filter((q) => {
      const a = answers[q.id];
      return a !== undefined && isFinalAnswer(a.value as AnswerValue, a.points);
    });
    const points = answered.reduce((sum, q) => sum + (answers[q.id]?.points ?? 0), 0);

    let state: TileState;
    if (!isModuleOpen(key) && !preview) {
      state = { kind: 'locked', unlockAt: unlockTimestamp(key) };
    } else if (total === 0) {
      state = { kind: 'soon', note: 'kommt noch' };
    } else if (answered.length === total) {
      state = { kind: 'done', points };
    } else {
      state = { kind: 'open', done: answered.length, total };
    }

    return { n, level, state };
  });

  const bingoDone = bingoFieldsFor(guest.id).filter((f) => answers[f.id] !== undefined).length;
  const bingoPoints = Object.entries(answers)
    .filter(([id]) => id.startsWith('bingo_'))
    .reduce((sum, [, a]) => sum + a.points, 0);
  let bingoState: TileState;
  if (!isModuleOpen('bingo') && !preview) {
    bingoState = { kind: 'locked', unlockAt: unlockTimestamp('bingo') };
  } else if (bingoDone === BINGO_SIZE) {
    bingoState = { kind: 'done', points: bingoPoints };
  } else {
    bingoState = { kind: 'open', done: bingoDone, total: BINGO_SIZE };
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Hallo {guest.name.split(' ')[0]}!</h1>
        <p className="text-[var(--muted)]">
          Schau den Tag über immer mal wieder rein. Alles wird sofort gespeichert.
        </p>
      </div>

      {levelTiles.map(({ n, level, state }) => (
        <Tile
          key={n}
          href={`/level/${n}`}
          title={level.title}
          subtitle={level.subtitle}
          state={state}
        />
      ))}

      <Tile
        href="/bingo"
        title="Selfie-Bingo"
        subtitle={`${BINGO_SIZE} Selfie-Aufgaben für dein Team`}
        state={bingoState}
      />

      <Tile
        href="/live"
        title="Live-Runde"
        subtitle="Am Abend, alle gleichzeitig"
        state={{ kind: 'locked', unlockAt: null, note: 'ab 20 Uhr' }}
      />
    </div>
  );
}
