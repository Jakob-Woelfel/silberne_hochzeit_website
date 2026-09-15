'use client';

import { useMemo, useState } from 'react';
import { BINGO_PREFIX } from '@/content/bingo';
import { TEAMS, teamById } from '@/content/teams';
import { groupPhotos, type GalleryPhoto } from '@/lib/gallery';
import { downloadAsZip, type ZipProgress } from '@/lib/zipDownload';
import { PhotoGrid } from './PhotoGrid';
import { Lightbox } from './Lightbox';

type View = 'time' | 'person' | 'field';

const VIEWS: { key: View; label: string }[] = [
  { key: 'time', label: 'Zeitlich' },
  { key: 'person', label: 'Nach Person' },
  { key: 'field', label: 'Nach Aufgabe' },
];

/** Ab hier ein Hinweis auf die Größe (≈ 280 KB pro Foto). */
const BIG_ZIP_FROM = 100;
const KB_PER_PHOTO = 280;

const teamName = (id: number | null) => teamById(id)?.name ?? '–';

export function SelfieGallery({
  photos,
  currentGuestId,
}: {
  photos: GalleryPhoto[];
  currentGuestId: string;
}) {
  const [view, setView] = useState<View>('time');
  const [team, setTeam] = useState<number | null>(null);
  const [onlyMine, setOnlyMine] = useState(false);
  const [person, setPerson] = useState<string>('');
  const [field, setField] = useState<string>('');
  const [open, setOpen] = useState<number | null>(null);
  const [zipping, setZipping] = useState<{ id: string; progress: ZipProgress } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const people = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of photos) if (!seen.has(p.guestId)) seen.set(p.guestId, p.name);
    return [...seen.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }, [photos]);

  const fields = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of photos) if (!seen.has(p.fieldId)) seen.set(p.fieldId, p.fieldText);
    return [...seen.entries()]
      .map(([id, text]) => ({ id, text }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [photos]);

  const visible = useMemo(
    () =>
      photos.filter(
        (p) =>
          (team === null || p.teamId === team) &&
          (!onlyMine || p.guestId === currentGuestId) &&
          (person === '' || p.guestId === person) &&
          (field === '' || p.fieldId === field),
      ),
    [photos, team, onlyMine, person, field, currentGuestId],
  );

  const groups = useMemo(
    () => (view === 'time' ? null : groupPhotos(visible, view === 'person' ? 'guest' : 'field')),
    [visible, view],
  );

  const hasFilter = team !== null || onlyMine || person !== '' || field !== '';
  const mineCount = useMemo(
    () => photos.filter((p) => p.guestId === currentGuestId).length,
    [photos, currentGuestId],
  );

  const startZip = async (id: string, list: GalleryPhoto[], zipName: string) => {
    if (zipping) return;
    setError(null);
    setZipping({ id, progress: { done: 0, total: list.length } });
    try {
      await downloadAsZip(list, {
        zipName,
        teamName,
        onProgress: (progress) => setZipping({ id, progress }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download fehlgeschlagen.');
    } finally {
      setZipping(null);
    }
  };

  const openPhoto = (photo: GalleryPhoto) => {
    const i = visible.findIndex((p) => p.id === photo.id);
    if (i >= 0) setOpen(i);
  };

  // Beschriftung des großen Download-Buttons je nach Filter
  const selectionLabel = (() => {
    if (!hasFilter) return `Alle ${visible.length} Fotos`;
    const parts: string[] = [];
    if (onlyMine) parts.push('meine');
    else if (person) parts.push(`von ${people.find((p) => p.id === person)?.name ?? '…'}`);
    if (team !== null) parts.push(`aus ${teamName(team)}`);
    if (field) parts.push('zu dieser Aufgabe');
    return `${visible.length} Fotos ${parts.join(', ')}`;
  })();

  return (
    <div className="flex flex-col gap-5">
      {/* Ansicht */}
      <div
        role="tablist"
        aria-label="Ansicht"
        className="grid grid-cols-3 gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1"
      >
        {VIEWS.map((v) => {
          const active = view === v.key;
          return (
            <button
              key={v.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setView(v.key)}
              className={`min-h-[44px] rounded-lg px-2 text-[15px] font-semibold ${
                active ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)]'
              }`}
            >
              {v.label}
            </button>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Chip active={team === null && !onlyMine} onClick={() => { setTeam(null); setOnlyMine(false); }}>
            Alle
          </Chip>
          {TEAMS.map((t) => (
            <Chip
              key={t.id}
              active={team === t.id}
              color={t.color}
              onClick={() => { setTeam(team === t.id ? null : t.id); setOnlyMine(false); }}
            >
              {t.name}
            </Chip>
          ))}
          {mineCount > 0 && (
            <Chip
              active={onlyMine}
              onClick={() => { setOnlyMine(!onlyMine); setTeam(null); setPerson(''); }}
            >
              Meine Fotos ({mineCount})
            </Chip>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Select
            label="Person"
            value={person}
            onChange={(v) => { setPerson(v); if (v) setOnlyMine(false); }}
            options={[{ value: '', label: 'alle Personen' }, ...people.map((p) => ({ value: p.id, label: p.name }))]}
          />
          <Select
            label="Aufgabe"
            value={field}
            onChange={setField}
            options={[{ value: '', label: 'alle Aufgaben' }, ...fields.map((f) => ({ value: f.id, label: `… ${f.text}` }))]}
          />
        </div>
      </div>

      {/* Download der Auswahl */}
      <div className="flex flex-col gap-2">
        <ZipButton
          busy={zipping?.id === 'selection' ? zipping.progress : null}
          disabled={visible.length === 0 || (zipping !== null && zipping.id !== 'selection')}
          onClick={() => startZip('selection', visible, hasFilter ? 'Selfie-Bingo Auswahl.zip' : 'Selfie-Bingo alle Fotos.zip')}
          primary
        >
          {selectionLabel} als ZIP herunterladen
        </ZipButton>
        {visible.length >= BIG_ZIP_FROM && (
          <p className="text-center text-[14px] text-[var(--muted)]">
            ≈ {Math.round((visible.length * KB_PER_PHOTO) / 1024)} MB – am besten im WLAN oder am Computer.
          </p>
        )}
        {error && (
          <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[15px] text-red-800">
            {error}
          </p>
        )}
      </div>

      {/* Inhalt */}
      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-[var(--muted)]">
          Keine Fotos für diese Auswahl.
        </p>
      ) : groups === null ? (
        <PhotoGrid photos={visible} onOpen={openPhoto} />
      ) : (
        <div className="flex flex-col gap-7">
          {groups.map((g) => {
            const first = g.photos[0];
            const t = teamById(first.teamId);
            const title = view === 'person' ? first.name : first.fieldText;
            const zipName =
              view === 'person'
                ? `Selfie-Bingo ${first.name}.zip`
                : `Selfie-Bingo Aufgabe ${first.fieldText.split(' ').slice(0, 3).join(' ')}.zip`;
            return (
              <section key={g.key} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {view === 'person' ? (
                      <p className="flex items-center gap-2 text-lg font-semibold">
                        {t && (
                          <span
                            className="inline-block h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: t.color }}
                            aria-hidden
                          />
                        )}
                        <span className="truncate">{title}</span>
                      </p>
                    ) : (
                      <p className="text-[17px] font-semibold leading-snug">
                        <span className="text-[var(--muted)]">{BINGO_PREFIX} </span>
                        {title}
                      </p>
                    )}
                    <p className="text-[15px] text-[var(--muted)]">
                      {view === 'person' && t ? `${t.name} · ` : ''}
                      {g.photos.length} {g.photos.length === 1 ? 'Foto' : 'Fotos'}
                    </p>
                  </div>
                  <ZipButton
                    busy={zipping?.id === g.key ? zipping.progress : null}
                    disabled={zipping !== null && zipping.id !== g.key}
                    onClick={() => startZip(g.key, g.photos, zipName)}
                  >
                    ZIP
                  </ZipButton>
                </div>
                <PhotoGrid photos={g.photos} onOpen={openPhoto} showName={view !== 'person'} />
              </section>
            );
          })}
        </div>
      )}

      {open !== null && visible[open] && (
        <Lightbox
          photos={visible}
          index={open}
          onClose={() => setOpen(null)}
          onIndexChange={setOpen}
        />
      )}
    </div>
  );
}

function Chip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-[15px] font-medium ${
        active
          ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]'
      }`}
    >
      {color && (
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{ backgroundColor: color, boxShadow: active ? '0 0 0 2px white' : undefined }}
          aria-hidden
        />
      )}
      {children}
    </button>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3">
      <span className="shrink-0 text-[15px] text-[var(--muted)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[44px] w-full min-w-0 bg-transparent text-[17px]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ZipButton({
  busy,
  disabled,
  onClick,
  primary = false,
  children,
}: {
  busy: ZipProgress | null;
  disabled: boolean;
  onClick: () => void;
  primary?: boolean;
  children: React.ReactNode;
}) {
  const label = busy
    ? busy.done < busy.total
      ? `Lade ${busy.done}/${busy.total} …`
      : 'Packe …'
    : children;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy !== null}
      aria-busy={busy !== null}
      className={
        primary
          ? 'min-h-[56px] w-full rounded-xl bg-[var(--accent)] px-5 font-semibold text-white shadow-sm disabled:opacity-60'
          : 'min-h-[44px] shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-[15px] font-semibold text-[var(--accent-strong)] tabular-nums disabled:opacity-60'
      }
    >
      {label}
    </button>
  );
}
