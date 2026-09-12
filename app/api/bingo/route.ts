import { NextResponse } from 'next/server';
import { getGuestId } from '@/lib/guest';
import { supabaseAdmin } from '@/lib/supabase/server';
import { bingoFieldsFor } from '@/content/bingo';
import { isAdminPreview } from '@/lib/admin';
import { loadModuleAccess } from '@/lib/modules';
import { completeBingoField } from '@/lib/bingo';
import { SELFIE_BUCKET, selfiePath } from '@/lib/selfies';

export const dynamic = 'force-dynamic';

type Body =
  | { action: 'sign'; fieldId: string }
  | { action: 'confirm'; fieldId: string };

/**
 * Zwei Schritte pro Selfie:
 *  1. `sign`    – signierte Upload-URL für genau dieses Feld (Pfad = <guest>/<feld>.jpg).
 *                 Der Client lädt damit direkt in den Bucket, nicht durch diese Route.
 *  2. `confirm` – Server prüft, dass das Objekt liegt, schreibt Feld + Boni.
 */
export async function POST(request: Request) {
  const guestId = await getGuestId();
  if (!guestId) {
    return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  // nur Felder aus dem eigenen Grid
  const field =
    typeof body?.fieldId === 'string'
      ? bingoFieldsFor(guestId).find((f) => f.id === body.fieldId)
      : undefined;
  if (!field) {
    return NextResponse.json({ error: 'Feld unbekannt.' }, { status: 404 });
  }

  if (!(await isAdminPreview()) && !(await loadModuleAccess()).isOpen('bingo')) {
    return NextResponse.json({ error: 'Das Bingo ist gerade nicht offen.' }, { status: 403 });
  }

  const storage = supabaseAdmin().storage.from(SELFIE_BUCKET);
  const path = selfiePath(guestId, field.id);

  if (body.action === 'sign') {
    const { data, error } = await storage.createSignedUploadUrl(path, { upsert: true });
    if (error || !data) {
      console.error('signed upload url failed', error);
      return NextResponse.json(
        { error: 'Upload konnte nicht vorbereitet werden. Bitte noch einmal versuchen.' },
        { status: 500 },
      );
    }
    return NextResponse.json({ path: data.path, token: data.token });
  }

  if (body.action === 'confirm') {
    const { data: exists } = await storage.exists(path);
    if (!exists) {
      return NextResponse.json(
        { error: 'Das Foto ist nicht angekommen. Bitte noch einmal versuchen.' },
        { status: 409 },
      );
    }

    try {
      const { state, newBonuses } = await completeBingoField(guestId, field.id, path);
      return NextResponse.json({ ok: true, state, newBonuses });
    } catch (err) {
      console.error(err);
      return NextResponse.json(
        { error: 'Speichern fehlgeschlagen. Bitte noch einmal versuchen.' },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ error: 'Unbekannte Aktion.' }, { status: 400 });
}
