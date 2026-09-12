import 'server-only';

import { supabaseAdmin } from '@/lib/supabase/server';
import { moduleOfTask, type ModuleKey } from '@/content/schedule';
import { isModuleOpen } from '@/lib/unlock';
import { loadSession } from '@/lib/live';

/**
 * Effektiver Zustand eines Moduls: manueller Override (Admin) schlägt den
 * Zeitplan; ohne Override gilt die Uhrzeit, und Level/Bingo schließen mit
 * Beginn der Live-Runde (Kickoff 4.1).
 */

export type Override = 'open' | 'closed';
export type ModuleReason = 'open' | 'not_yet' | 'closed';

/** Module, die der Admin manuell steuern kann (Live läuft über das Host-Panel). */
export const CONTROLLABLE_MODULES: ModuleKey[] = ['l1', 'l2', 'l3', 'bingo', 'solutions'];

const CLOSES_WITH_LIVE = new Set<ModuleKey>(['l1', 'l2', 'l3', 'bingo']);

export type ModuleAccess = {
  overrides: Partial<Record<ModuleKey, Override>>;
  liveStarted: boolean;
  /** Tabelle module_overrides vorhanden (0004_module_overrides.sql)? */
  migrationOk: boolean;
  isOpen(key: ModuleKey, now?: number): boolean;
  reason(key: ModuleKey, now?: number): ModuleReason;
  isTaskOpen(taskId: string, now?: number): boolean;
};

export async function loadModuleAccess(): Promise<ModuleAccess> {
  const [session, result] = await Promise.all([
    loadSession(),
    supabaseAdmin().from('module_overrides').select('key, state'),
  ]);

  const overrides: Partial<Record<ModuleKey, Override>> = {};
  const migrationOk = !result.error;
  for (const row of (result.data ?? []) as unknown as { key: ModuleKey; state: Override }[]) {
    overrides[row.key] = row.state;
  }
  const liveStarted = session.phase !== 'idle';

  const reason = (key: ModuleKey, now = Date.now()): ModuleReason => {
    const o = overrides[key];
    if (o === 'open') return 'open';
    if (o === 'closed') return 'closed';
    if (!isModuleOpen(key, now)) return 'not_yet';
    if (liveStarted && CLOSES_WITH_LIVE.has(key)) return 'closed';
    return 'open';
  };

  return {
    overrides,
    liveStarted,
    migrationOk,
    reason,
    isOpen: (key, now) => reason(key, now) === 'open',
    isTaskOpen: (taskId, now) => {
      const key = moduleOfTask(taskId);
      return key !== null && reason(key, now) === 'open';
    },
  };
}
