/** Client-safe: öffentliche URL eines Selfies im Bucket `selfies`. */

export const SELFIE_BUCKET = 'selfies';

export function selfieUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return `${base}/storage/v1/object/public/${SELFIE_BUCKET}/${path}`;
}

/** Storage-Pfad eines Selfies: ein Objekt pro Gast und Feld, Re-Upload überschreibt. */
export function selfiePath(guestId: string, fieldId: string): string {
  return `${guestId}/${fieldId}.jpg`;
}
