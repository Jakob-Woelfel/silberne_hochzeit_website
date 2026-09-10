import { moduleOfTask, unlockTimestamp, type ModuleKey } from '@/content/schedule';

export function unlockAll(): boolean {
  return (
    process.env.UNLOCK_ALL === 'true' || process.env.NEXT_PUBLIC_UNLOCK_ALL === 'true'
  );
}

/** Ist ein Modul zum Zeitpunkt `now` offen? Live wird separat über die session-Tabelle gesteuert. */
export function isModuleOpen(key: ModuleKey, now: number = Date.now()): boolean {
  if (unlockAll()) return true;
  const ts = unlockTimestamp(key);
  if (ts === null) return false;
  return now >= ts;
}

export function isTaskOpen(taskId: string, now: number = Date.now()): boolean {
  const key = moduleOfTask(taskId);
  if (!key) return false;
  return isModuleOpen(key, now);
}
