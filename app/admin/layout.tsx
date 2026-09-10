import type { Metadata } from 'next';
import Link from 'next/link';
import { isAdmin } from '@/lib/admin';
import { AdminLogin } from '@/components/admin/AdminLogin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  if (!(await isAdmin())) return <AdminLogin />;

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
          <Link href="/admin" className="font-semibold">
            Admin
          </Link>
          <Link href="/admin/content" className="text-[15px] text-[var(--muted)]">
            Inhalte
          </Link>
          <Link href="/home" className="text-[15px] text-[var(--muted)]">
            Gast-Ansicht
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
