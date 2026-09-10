/** Serverzeit-Offset, damit Countdowns nicht an falsch gestellten Handyuhren hängen. */

let offset = 0;
let synced = false;

export async function syncServerTime(): Promise<number> {
  try {
    const res = await fetch('/api/time', { cache: 'no-store' });
    const { now } = (await res.json()) as { now: number };
    offset = now - Date.now();
    synced = true;
  } catch {
    offset = 0;
  }
  return offset;
}

export function serverNow(): number {
  return Date.now() + offset;
}

export function isSynced(): boolean {
  return synced;
}

/** '02:14:07' bzw. '14:07' – für Countdown-Anzeigen. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
