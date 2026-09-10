import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function BingoPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">Selfie-Bingo</h1>
      <Card>
        <p className="text-[var(--muted)]">
          Neun Aufgaben für dein Team, mit Foto. Kommt in Kürze.
        </p>
      </Card>
      <Link href="/home" className="block">
        <Button variant="secondary">Zurück zur Übersicht</Button>
      </Link>
    </div>
  );
}
