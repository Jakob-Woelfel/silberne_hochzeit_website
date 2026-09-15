'use client';

import { useEffect, useRef } from 'react';
import { BINGO_PREFIX } from '@/content/bingo';
import { teamById } from '@/content/teams';
import { formatTime, type GalleryPhoto } from '@/lib/gallery';

const SWIPE_PX = 50;

/**
 * Vollbild-Ansicht eines Fotos mit Kontext, Blättern (Tasten, Swipe, Buttons)
 * und Download. Das Original kommt direkt aus dem Storage; `?download=` lässt
 * Supabase einen Content-Disposition-Header mit sprechendem Namen setzen.
 */
export function Lightbox({
  photos,
  index,
  onClose,
  onIndexChange,
}: {
  photos: GalleryPhoto[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const photo = photos[index];
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);

  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;
  const prev = () => hasPrev && onIndexChange(index - 1);
  const next = () => hasNext && onIndexChange(index + 1);

  useEffect(() => {
    closeRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Nachbarn vorladen, damit Blättern nicht ruckelt
  useEffect(() => {
    for (const p of [photos[index - 1], photos[index + 1]]) {
      if (p) new Image().src = p.url;
    }
  }, [photos, index]);

  if (!photo) return null;
  const team = teamById(photo.teamId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Foto von ${photo.name}`}
      className="fixed inset-0 z-50 flex flex-col bg-[#1c1917] text-white"
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        touchStartX.current = null;
        if (start === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? start) - start;
        if (dx > SWIPE_PX) prev();
        else if (dx < -SWIPE_PX) next();
      }}
    >
      <div className="flex items-center justify-between px-2 pt-[env(safe-area-inset-top)]">
        <p className="px-3 text-[15px] tabular-nums text-white/70">
          {index + 1} / {photos.length}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Schließen"
          className="flex h-14 w-14 items-center justify-center rounded-full text-3xl leading-none text-white/90"
        >
          ×
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- Original aus dem Storage */}
        <img
          key={photo.id}
          src={photo.url}
          alt={`${photo.name}: ${BINGO_PREFIX} ${photo.fieldText}`}
          className="max-h-full max-w-full object-contain select-none"
          draggable={false}
        />
        <NavButton side="left" onClick={prev} disabled={!hasPrev} />
        <NavButton side="right" onClick={next} disabled={!hasNext} />
      </div>

      <div className="px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3">
        <p className="flex items-center gap-2 text-lg font-semibold">
          {team && (
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: team.color }}
              aria-hidden
            />
          )}
          <span className="truncate">{photo.name}</span>
          <span className="shrink-0 text-[15px] font-normal text-white/60">
            {team?.name ?? ''} · {formatTime(photo.createdAt)} Uhr
          </span>
        </p>
        <p className="mt-1 line-clamp-3 text-[15px] text-white/80">
          {photo.fieldIndex > 0 ? `Feld ${photo.fieldIndex} · ` : ''}
          {BINGO_PREFIX} {photo.fieldText}
        </p>
        <a
          href={`${photo.url}?download=${encodeURIComponent(photo.filename)}`}
          className="mt-3 flex min-h-[56px] w-full items-center justify-center rounded-xl bg-white font-semibold text-[#1c1917]"
        >
          Herunterladen
        </a>
        <p className="mt-2 text-center text-[14px] text-white/55">
          Auf dem Handy: Bild lange drücken → „In Fotos sichern“
        </p>
      </div>
    </div>
  );
}

function NavButton({
  side,
  onClick,
  disabled,
}: {
  side: 'left' | 'right';
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === 'left' ? 'Vorheriges Foto' : 'Nächstes Foto'}
      className={`absolute top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-3xl leading-none text-white disabled:opacity-0 ${
        side === 'left' ? 'left-2' : 'right-2'
      }`}
    >
      {side === 'left' ? '‹' : '›'}
    </button>
  );
}
