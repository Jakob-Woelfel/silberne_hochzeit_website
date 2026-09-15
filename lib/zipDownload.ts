import { Zip, ZipPassThrough } from 'fflate';
import { csvOverview, zipEntryPath, type GalleryPhoto } from '@/lib/gallery';

/**
 * Packt Fotos im Browser zu einem ZIP und stößt den Download an. Läuft
 * komplett clientseitig: der Storage-Bucket ist öffentlich und erlaubt CORS,
 * damit umgehen wir Größen- und Laufzeitlimits einer Server-Route.
 *
 * JPEGs werden nur „gespeichert“ (ZipPassThrough), nicht erneut komprimiert.
 */

const PARALLEL = 4;

export type ZipProgress = { done: number; total: number };

export async function downloadAsZip(
  photos: GalleryPhoto[],
  options: {
    zipName: string;
    teamName: (teamId: number | null) => string;
    onProgress?: (p: ZipProgress) => void;
  },
): Promise<void> {
  if (photos.length === 0) return;

  const chunks: Uint8Array[] = [];
  let failed: Error | null = null;

  const zip = new Zip((err, chunk) => {
    if (err) failed = err;
    else chunks.push(chunk);
  });

  const addFile = (path: string, bytes: Uint8Array) => {
    const entry = new ZipPassThrough(path);
    zip.add(entry);
    entry.push(bytes, true);
  };

  const encoder = new TextEncoder();
  addFile('Selfie-Bingo/uebersicht.csv', encoder.encode(csvOverview(photos, options.teamName)));

  // Reihenfolge im ZIP bleibt die der Liste, Downloads laufen parallel.
  const bytes = new Array<Uint8Array | null>(photos.length).fill(null);
  let next = 0;
  let done = 0;
  let cursor = 0;

  const flush = () => {
    while (cursor < photos.length && bytes[cursor]) {
      addFile(zipEntryPath(photos[cursor]), bytes[cursor]!);
      bytes[cursor] = null;
      cursor++;
    }
  };

  const worker = async () => {
    while (next < photos.length) {
      const i = next++;
      const photo = photos[i];
      const res = await fetch(photo.url);
      if (!res.ok) throw new Error(`„${photo.filename}“ konnte nicht geladen werden (${res.status}).`);
      bytes[i] = new Uint8Array(await res.arrayBuffer());
      done++;
      options.onProgress?.({ done, total: photos.length });
      flush();
    }
  };

  await Promise.all(Array.from({ length: Math.min(PARALLEL, photos.length) }, worker));
  flush();
  zip.end();

  if (failed) throw failed;

  const blob = new Blob(chunks as BlobPart[], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = options.zipName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Safari braucht das Objekt noch kurz nach dem Klick
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
