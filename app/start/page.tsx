import { StartForm } from '@/components/StartForm';

export const dynamic = 'force-dynamic';

export default function StartPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-10">
      <p className="text-[15px] uppercase tracking-[0.18em] text-[var(--muted)]">
        Silberhochzeit
      </p>
      <h1 className="mt-2 text-3xl font-semibold leading-tight">
        Bernd &amp; Katrin
      </h1>
      <p className="mt-3 text-[var(--muted)]">
        Quiz, Selfie-Bingo und am Abend die Live-Runde. Trag deinen Namen ein, dann geht
        es los.
      </p>
      <StartForm />
    </div>
  );
}
