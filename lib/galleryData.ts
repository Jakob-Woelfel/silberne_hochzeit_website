import 'server-only';

import { supabaseAdmin } from '@/lib/supabase/server';
import { bingoFieldById, bingoFieldsFor } from '@/content/bingo';
import { selfieUrl } from '@/lib/selfies';
import { disambiguateNames, photoFilename, shortFieldText, type GalleryPhoto } from '@/lib/gallery';

type Row = {
  id: string;
  task_id: string;
  storage_path: string;
  created_at: string;
  guests: { id: string; name: string; team_id: number | null } | null;
};

/** Alle Selfies mit Kontext, neueste zuerst. Nur öffentliche Daten, keine Punkte. */
export async function loadGalleryPhotos(): Promise<GalleryPhoto[]> {
  const { data, error } = await supabaseAdmin()
    .from('uploads')
    .select('id, task_id, storage_path, created_at, guests(id, name, team_id)')
    .order('created_at', { ascending: false })
    .range(0, 1999);
  if (error) {
    console.error('gallery load failed', error);
    return [];
  }

  const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.guests !== null);

  // Dateinamen: gleiche Vornamen auseinanderhalten, Reihenfolge = erster Upload
  const guestsInOrder: { id: string; name: string }[] = [];
  const seen = new Set<string>();
  for (const r of [...rows].reverse()) {
    if (r.guests && !seen.has(r.guests.id)) {
      seen.add(r.guests.id);
      guestsInOrder.push({ id: r.guests.id, name: r.guests.name });
    }
  }
  const displayName = disambiguateNames(guestsInOrder);

  // Feldreihenfolge pro Gast nur einmal berechnen
  const gridCache = new Map<string, string[]>();
  const fieldIndex = (guestId: string, fieldId: string) => {
    let ids = gridCache.get(guestId);
    if (!ids) {
      ids = bingoFieldsFor(guestId).map((f) => f.id);
      gridCache.set(guestId, ids);
    }
    return ids.indexOf(fieldId) + 1;
  };

  return rows.map((r) => {
    const guest = r.guests!;
    const name = displayName.get(guest.id) ?? guest.name;
    const index = fieldIndex(guest.id, r.task_id);
    const fieldText = shortFieldText(bingoFieldById(r.task_id)?.text ?? r.task_id);
    return {
      id: r.id,
      url: selfieUrl(r.storage_path),
      guestId: guest.id,
      name,
      teamId: guest.team_id,
      fieldId: r.task_id,
      fieldIndex: index,
      fieldText,
      createdAt: r.created_at,
      filename: photoFilename(name, index, fieldText),
    };
  });
}

/** Nur die Anzahl, für die Kachel auf /home. */
export async function countGalleryPhotos(): Promise<number> {
  const { count } = await supabaseAdmin()
    .from('uploads')
    .select('id', { count: 'exact', head: true });
  return count ?? 0;
}
