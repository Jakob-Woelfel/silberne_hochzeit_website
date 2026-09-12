'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BINGO_COLS, BINGO_PREFIX, type BingoField } from '@/content/bingo';
import { BINGO_FIELD_POINTS, BINGO_FULL_POINTS, BINGO_LINE_POINTS } from '@/lib/scoring';
import { selfieUrl } from '@/lib/selfies';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';

export type BingoClientState = {
  done: Record<string, string>;
  points: number;
  bonuses: string[];
};

/** Bonus-ID -> Text für den Hinweis nach dem Upload. */
function describeBonus(id: string): string {
  if (id === 'bingo_full') return `Alle Felder voll: +${BINGO_FULL_POINTS} Punkte für dein Team!`;
  const m = /^bingo_(row|col)_(\d+)$/.exec(id);
  if (!m) return `Bonus: +${BINGO_LINE_POINTS} Punkte`;
  const kind = m[1] === 'row' ? 'Reihe' : 'Spalte';
  return `${kind} ${m[2]} voll: +${BINGO_LINE_POINTS} Punkte für dein Team!`;
}

/** Bild auf ~300 KB / 1600 px bringen, bevor es über Mobilfunk geht (Kickoff §9). */
async function compress(file: File): Promise<Blob> {
  try {
    const { default: imageCompression } = await import('browser-image-compression');
    return await imageCompression(file, {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.8,
    });
  } catch {
    // z. B. exotisches Format: dann eben das Original (Bucket-Limit 2 MB)
    return file;
  }
}

export function BingoGrid({
  fields,
  initial,
  open,
}: {
  fields: BingoField[];
  initial: BingoClientState;
  open: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<BingoClientState>(initial);
  const [selected, setSelected] = useState<BingoField | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // fieldId in Arbeit
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const doneCount = fields.filter((f) => state.done[f.id] !== undefined).length;

  async function upload(field: BingoField, file: File) {
    setBusy(field.id);
    setError(null);
    setToast(null);
    try {
      const signRes = await fetch('/api/bingo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sign', fieldId: field.id }),
      });
      const sign = await signRes.json();
      if (!signRes.ok) throw new Error(sign.error ?? 'Upload konnte nicht starten.');

      const blob = await compress(file);
      const { supabaseBrowser } = await import('@/lib/supabase/client');
      const { error: upErr } = await supabaseBrowser()
        .storage.from('selfies')
        .uploadToSignedUrl(sign.path, sign.token, blob, { contentType: 'image/jpeg' });
      if (upErr) throw new Error('Foto konnte nicht hochgeladen werden.');

      const confirmRes = await fetch('/api/bingo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', fieldId: field.id }),
      });
      const confirm = await confirmRes.json();
      if (!confirmRes.ok) throw new Error(confirm.error ?? 'Speichern fehlgeschlagen.');

      // Cache-Buster, damit ein neues Foto im selben Pfad sofort erscheint
      const stamped = { ...confirm.state, done: { ...confirm.state.done } };
      stamped.done[field.id] = `${confirm.state.done[field.id]}?v=${Date.now()}`;
      setState(stamped);
      setSelected(null);
      const bonuses: string[] = confirm.newBonuses ?? [];
      setToast(
        bonuses.length > 0
          ? bonuses.map(describeBonus).join(' ')
          : `Feld geschafft: +${BINGO_FIELD_POINTS} Punkte für dein Team.`,
      );
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Keine Verbindung. Das Foto ist noch auf deinem Handy – einfach nochmal.',
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="mb-2 flex items-center justify-between text-[15px] text-[var(--muted)]">
          <span>
            {doneCount} von {fields.length} Feldern
          </span>
          <span className="tabular-nums">{state.points} P fürs Team</span>
        </div>
        <Progress value={doneCount} max={fields.length} />
      </div>

      {toast && (
        <p className="rounded-xl bg-green-50 px-4 py-3 text-[15px] text-green-900">{toast}</p>
      )}

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${BINGO_COLS}, minmax(0, 1fr))` }}
      >
        {fields.map((field, i) => {
          const path = state.done[field.id];
          const done = path !== undefined;
          return (
            <button
              key={field.id}
              type="button"
              onClick={() => {
                setError(null);
                setSelected(field);
              }}
              aria-label={`Feld ${i + 1}${done ? ', erledigt' : ''}`}
              className={`relative aspect-square overflow-hidden rounded-xl border text-left transition active:scale-[0.97] ${
                done
                  ? 'border-[var(--accent)]'
                  : 'border-[var(--border)] bg-[var(--surface)]'
              }`}
            >
              {done ? (
                // eslint-disable-next-line @next/next/no-img-element -- Storage-URL, kein Optimizer nötig
                <img
                  src={selfieUrl(path)}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-2xl font-semibold text-[var(--muted)]">
                  {i + 1}
                </span>
              )}
              {done && (
                <span className="absolute right-1 top-1 rounded-full bg-[var(--accent)] px-2 text-[13px] font-semibold text-white">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-[15px] text-[var(--muted)]">
        {BINGO_PREFIX} Tippe ein Feld für die Aufgabe. {BINGO_FIELD_POINTS} P pro Feld, volle
        Reihe oder Spalte +{BINGO_LINE_POINTS} P, alles voll +{BINGO_FULL_POINTS} P – alles für dein Team.
      </p>

      {selected && (
        <div
          className="fixed inset-0 z-40 flex items-end bg-black/40"
          onClick={() => busy === null && setSelected(null)}
        >
          <div
            className="w-full rounded-t-3xl bg-[var(--surface)] p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[15px] text-[var(--muted)]">
              Feld {fields.indexOf(selected) + 1} · {BINGO_PREFIX}
            </p>
            <h2 className="mt-1 text-xl font-semibold leading-snug">{selected.text}</h2>

            {state.done[selected.id] !== undefined && (
              // eslint-disable-next-line @next/next/no-img-element -- Storage-URL
              <img
                src={selfieUrl(state.done[selected.id])}
                alt="Dein Selfie"
                className="mt-4 max-h-[40vh] w-full rounded-2xl object-cover"
              />
            )}

            {error && (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[15px] text-red-800">
                {error}
              </p>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file && selected) void upload(selected, file);
              }}
            />

            <div className="mt-5 flex flex-col gap-3">
              {open ? (
                <Button
                  onClick={() => inputRef.current?.click()}
                  disabled={busy !== null}
                >
                  {busy === selected.id
                    ? 'Wird hochgeladen …'
                    : state.done[selected.id] !== undefined
                      ? 'Anderes Selfie hochladen'
                      : 'Selfie aufnehmen'}
                </Button>
              ) : (
                <p className="text-[15px] text-[var(--muted)]">
                  Das Bingo ist geschlossen, Fotos gehen nicht mehr.
                </p>
              )}
              <Button variant="secondary" onClick={() => setSelected(null)} disabled={busy !== null}>
                Schließen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
