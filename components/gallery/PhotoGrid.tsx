'use client';

import Image from 'next/image';
import { teamById } from '@/content/teams';
import { formatTime, type GalleryPhoto } from '@/lib/gallery';

/** Kachel ist auf dem Handy ~165 px breit; bei 2× DPR reicht das. */
const THUMB_PX = 320;

/**
 * Quadratische Kacheln, Team-Farbe als Innenrand. Thumbnails laufen über
 * next/image (remotePatterns auf den Storage-Host), das Original erst in der
 * Lightbox.
 */
export function PhotoGrid({
  photos,
  onOpen,
  showName = true,
}: {
  photos: GalleryPhoto[];
  onOpen: (photo: GalleryPhoto) => void;
  showName?: boolean;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {photos.map((photo) => {
        const team = teamById(photo.teamId);
        return (
          <li key={photo.id}>
            <button
              type="button"
              onClick={() => onOpen(photo)}
              className="block w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-left"
            >
              <div
                className="relative aspect-square w-full bg-[var(--border)]"
                style={{ boxShadow: `inset 0 0 0 3px ${team?.color ?? 'transparent'}` }}
              >
                {/* feste Breite statt fill: nur zwei srcset-Kandidaten, sonst wird das HTML bei 250 Bildern riesig */}
                <Image
                  src={photo.url}
                  alt=""
                  width={THUMB_PX}
                  height={THUMB_PX}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ padding: 3 }}
                />
              </div>
              <div className="px-3 py-2">
                {showName ? (
                  <p className="truncate text-[15px] font-semibold">{photo.name}</p>
                ) : (
                  <p className="truncate text-[15px] font-semibold">
                    {formatTime(photo.createdAt)} Uhr
                  </p>
                )}
                <p className="truncate text-[14px] text-[var(--muted)]">
                  {photo.fieldIndex > 0 ? `${photo.fieldIndex} · ` : ''}
                  {photo.fieldText}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
