'use client';

/** guest_id lebt doppelt: localStorage (überlebt Cookie-Verlust) + Cookie (Server liest ihn). */

export const GUEST_KEY = 'guest_id';

export function readLocalGuestId(): string | null {
  try {
    return window.localStorage.getItem(GUEST_KEY);
  } catch {
    return null;
  }
}

export function readCookieGuestId(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)guest_id=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function persistGuestId(id: string): void {
  try {
    window.localStorage.setItem(GUEST_KEY, id);
  } catch {
    // Privater Modus – der Cookie muss reichen
  }
  document.cookie = `guest_id=${encodeURIComponent(id)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function clearGuestId(): void {
  try {
    window.localStorage.removeItem(GUEST_KEY);
  } catch {
    /* ignore */
  }
  document.cookie = 'guest_id=; path=/; max-age=0; samesite=lax';
}

/** Cookie aus dem localStorage wiederherstellen. true, wenn etwas wiederhergestellt wurde. */
export function restoreCookieFromLocalStorage(): boolean {
  if (readCookieGuestId()) return false;
  const stored = readLocalGuestId();
  if (!stored) return false;
  persistGuestId(stored);
  return true;
}
