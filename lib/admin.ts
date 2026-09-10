import 'server-only';

import { cookies } from 'next/headers';
import { timingSafeEqual } from 'node:crypto';

/**
 * Zugang zu /admin (spaeter auch /host und /screen) ueber HOST_SECRET.
 * Der Schluessel kommt entweder als ?key=... oder aus einem Cookie,
 * damit man ihn nicht an jede URL haengen muss.
 */

export const ADMIN_COOKIE = 'admin_key';
/** Solange gesetzt, sind fuer diesen Browser alle Module offen. */
export const ADMIN_PREVIEW_COOKIE = 'admin_preview';
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 12;

function hostSecret(): string | null {
  const secret = process.env.HOST_SECRET;
  return secret && secret.length > 0 ? secret : null;
}

/** Vergleich mit konstanter Laufzeit, damit der Schluessel nicht erratbar wird. */
export function keyMatches(candidate: string | null | undefined): boolean {
  const secret = hostSecret();
  if (!secret || !candidate) return false;

  const a = Buffer.from(candidate);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return keyMatches(store.get(ADMIN_COOKIE)?.value);
}

/** Vorschau-Modus: Admin sieht alle Level offen, ohne die Env zu aendern. */
export async function isAdminPreview(): Promise<boolean> {
  const store = await cookies();
  if (store.get(ADMIN_PREVIEW_COOKIE)?.value !== '1') return false;
  return keyMatches(store.get(ADMIN_COOKIE)?.value);
}

/** true, wenn ueberhaupt ein HOST_SECRET konfiguriert ist. */
export function hasHostSecret(): boolean {
  return hostSecret() !== null;
}

/** Warnung fuer das Dashboard: zu kurzes oder offensichtliches Secret. */
export function hostSecretWarning(): string | null {
  const secret = hostSecret();
  if (!secret) return 'HOST_SECRET ist nicht gesetzt. /admin ist gesperrt.';
  if (secret.length < 24) {
    return `HOST_SECRET ist nur ${secret.length} Zeichen lang. Vor dem Deploy durch etwas Langes, Zufälliges ersetzen.`;
  }
  if (/lokal|test|secret|passwort|admin|1234/i.test(secret)) {
    return 'HOST_SECRET enthält ein erratbares Wort. Vor dem Deploy ersetzen.';
  }
  return null;
}
