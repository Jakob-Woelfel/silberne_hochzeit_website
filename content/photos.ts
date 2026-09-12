/**
 * Zuordnung Bild-ID -> Originaldatei in photos/ (NUR fürs Script und Tests).
 *
 * NICHT aus Client-Komponenten importieren: die Originaldateinamen enthalten die
 * Lösungen (Name, Alter). Im Client erscheinen nur die neutralen IDs, weil
 * `npm run photos` (scripts/crop.mts) daraus erzeugt:
 *   public/zoom/<id>_1.jpg … _3.jpg   drei Ausschnitte, eng → ganz
 *   public/age/<id>.jpg               verkleinertes Original
 *
 * Die ID muss zum `image` der jeweiligen Frage in levels.ts passen.
 */

export type ZoomPhoto = {
  id: string;
  /** Dateiname in photos/ */
  source: string;
  /** Mittelpunkt von Stufe 1 als Anteil der Bildbreite/-höhe (0–1), z. B. das Gesicht */
  focus: { x: number; y: number };
  /** eigene Stufen statt ZOOM_STEPS, z. B. enger bei sehr hochauflösenden Fotos */
  steps?: readonly [number, number, number];
};

export type AgePhoto = { id: string; source: string };

export const ZOOM_PHOTOS: ZoomPhoto[] = [
  { id: 'zoom1', source: 'zoom_1_katrin.jpg', focus: { x: 0.3, y: 0.15 }, steps: [1 / 18, 1 / 5, 1] },
  { id: 'zoom2', source: 'zoom_2_bernd.jpeg', focus: { x: 0.62, y: 0.6 } },
];

export const AGE_PHOTOS: AgePhoto[] = [
  { id: 'age1', source: 'age_1_bernd_17.jpg' },
  { id: 'age2', source: 'age_2_both_bernd25_Katrin19.jpeg' },
  { id: 'age3', source: 'age_3_both_bernd26_katrin20.jpeg' },
  { id: 'age4', source: 'age_4_both_bernd46_katrin_40.jpeg' },
];

/** Breite von Stufe 1/2/3 als Bruchteil der Originalbreite. */
export const ZOOM_STEPS = [1 / 10, 1 / 3.5, 1] as const;
