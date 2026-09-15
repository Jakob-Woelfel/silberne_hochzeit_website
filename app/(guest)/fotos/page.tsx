import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getGuest } from '@/lib/guest';
import { loadGalleryPhotos } from '@/lib/galleryData';
import { SelfieGallery } from '@/components/gallery/SelfieGallery';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

/**
 * Alle Selfies aus dem Bingo für die Gäste: ansehen, blättern, einzeln oder
 * als ZIP herunterladen. Der Bucket ist ohnehin öffentlich, deshalb keine
 * Zeitsperre.
 */
export default async function PhotosPage() {
  const guest = await getGuest();
  if (!guest) redirect('/start');

  const photos = await loadGalleryPhotos();
  const people = new Set(photos.map((p) => p.guestId)).size;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Fotos vom Tag</h1>
        <p className="text-[var(--muted)]">
          {photos.length === 0
            ? 'Noch keine Selfies.'
            : `${photos.length} Selfies von ${people} ${people === 1 ? 'Gast' : 'Gästen'} aus dem Selfie-Bingo. Tippe ein Foto an, um es groß zu sehen und zu speichern.`}
        </p>
      </div>

      {photos.length === 0 ? (
        <>
          <Card>
            <p className="text-[var(--muted)]">Sobald Selfies hochgeladen sind, erscheinen sie hier.</p>
          </Card>
          <Link href="/home" className="block">
            <Button variant="secondary">Zurück zur Übersicht</Button>
          </Link>
        </>
      ) : (
        <SelfieGallery photos={photos} currentGuestId={guest.id} />
      )}
    </div>
  );
}
