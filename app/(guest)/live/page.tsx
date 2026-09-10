import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function LivePage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">Live-Runde</h1>
      <Card>
        <p className="text-[var(--muted)]">
          Am Abend spielen alle gleichzeitig. Der Host startet die Runde.
        </p>
      </Card>
      <Link href="/home" className="block">
        <Button variant="secondary">Zurück zur Übersicht</Button>
      </Link>
    </div>
  );
}
