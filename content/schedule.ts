/**
 * Freischaltzeiten (Europe/Berlin) am Tag der Feier.
 * UNLOCK_ALL=true (Server) bzw. NEXT_PUBLIC_UNLOCK_ALL=true (Client) hebt alle Sperren auf.
 */

export type ModuleKey = 'l1' | 'l2' | 'l3' | 'bingo' | 'live';

export const EVENT_DATE = process.env.NEXT_PUBLIC_EVENT_DATE ?? '2026-09-12';

/** Lokale Uhrzeit in Europe/Berlin. */
export const UNLOCK_TIMES: Record<ModuleKey, string | null> = {
  l1: '12:00',
  l2: '14:00',
  l3: '17:00',
  bingo: '12:00',
  live: null, // wird vom Host manuell gestartet
};

/**
 * Berlin ist am 12.09. in der Sommerzeit (UTC+2). Fester Offset statt Zeitzonen-Bibliothek:
 * die App läuft an genau einem Tag.
 */
const BERLIN_UTC_OFFSET_HOURS = 2;

export function unlockTimestamp(key: ModuleKey): number | null {
  const time = UNLOCK_TIMES[key];
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  return Date.parse(
    `${EVENT_DATE}T${String(h - BERLIN_UTC_OFFSET_HOURS).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`,
  );
}

/** Modul-Schlüssel aus einer task_id ableiten: 'l1_q3' -> 'l1', 'bingo_5' -> 'bingo'. */
export function moduleOfTask(taskId: string): ModuleKey | null {
  if (/^l1_/.test(taskId)) return 'l1';
  if (/^l2_/.test(taskId)) return 'l2';
  if (/^l3_/.test(taskId)) return 'l3';
  if (/^bingo/.test(taskId)) return 'bingo';
  if (/^live/.test(taskId)) return 'live';
  return null;
}
