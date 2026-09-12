/**
 * Erzeugt aus den Originalen in photos/ (Zuordnung in content/photos.ts) die Bilder für Level 3:
 *   public/zoom/<id>_1.jpg … _3.jpg   drei Ausschnitte um den Fokuspunkt (eng → ganz)
 *   public/age/<id>.jpg               auf max. 1200 px verkleinert
 *
 * Aufruf: npm run photos   (Node ≥ 23 führt TypeScript direkt aus)
 */
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { AGE_PHOTOS, ZOOM_PHOTOS, ZOOM_STEPS } from '../content/photos.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'photos');
const OUT_ZOOM = path.join(ROOT, 'public', 'zoom');
const OUT_AGE = path.join(ROOT, 'public', 'age');
const ZOOM_SIZE = 800;
const AGE_MAX = 1200;
const QUALITY = 80;

function sourceFor(source: string): string | null {
  const file = path.join(SRC, source);
  return existsSync(file) ? file : null;
}

async function cropZoom(
  id: string,
  focus: { x: number; y: number },
  source: string,
  steps: readonly number[] = ZOOM_STEPS,
) {
  const image = sharp(source).rotate(); // EXIF-Orientierung anwenden
  const meta = await image.metadata();
  const W = meta.width ?? 0;
  const H = meta.height ?? 0;
  if (!W || !H) throw new Error(`${source}: keine Bildgröße lesbar`);

  for (let i = 0; i < steps.length; i++) {
    // quadratischer Ausschnitt, Seitenlänge = Anteil der Breite, auf den Bildrand geclamped
    const side = Math.min(Math.round(W * steps[i]), W, H);
    const left = Math.min(Math.max(Math.round(focus.x * W - side / 2), 0), W - side);
    const top = Math.min(Math.max(Math.round(focus.y * H - side / 2), 0), H - side);
    const out = path.join(OUT_ZOOM, `${id}_${i + 1}.jpg`);

    await sharp(source)
      .rotate()
      .extract({ left, top, width: side, height: side })
      .resize(ZOOM_SIZE, ZOOM_SIZE, { fit: 'cover' })
      .jpeg({ quality: QUALITY, mozjpeg: true })
      .toFile(out);
    console.log(`  ${path.relative(ROOT, out)}  (${side}px @ ${left},${top})`);
  }
}

async function resizeAge(id: string, source: string) {
  const out = path.join(OUT_AGE, `${id}.jpg`);
  await sharp(source)
    .rotate()
    .resize(AGE_MAX, AGE_MAX, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(out);
  console.log(`  ${path.relative(ROOT, out)}`);
}

async function main() {
  mkdirSync(OUT_ZOOM, { recursive: true });
  mkdirSync(OUT_AGE, { recursive: true });
  let missing = 0;

  for (const photo of ZOOM_PHOTOS) {
    const source = sourceFor(photo.source);
    if (!source) {
      console.warn(`✗ zoom ${photo.id}: keine Datei photos/${photo.source}`);
      missing++;
      continue;
    }
    console.log(`✓ zoom ${photo.id}`);
    await cropZoom(photo.id, photo.focus, source, photo.steps);
  }

  for (const photo of AGE_PHOTOS) {
    const source = sourceFor(photo.source);
    if (!source) {
      console.warn(`✗ age ${photo.id}: keine Datei photos/${photo.source}`);
      missing++;
      continue;
    }
    console.log(`✓ age ${photo.id}`);
    await resizeAge(photo.id, source);
  }

  if (missing > 0) {
    console.warn(`\n${missing} Bild(er) fehlen in photos/. Dateinamen in content/photos.ts prüfen.`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
