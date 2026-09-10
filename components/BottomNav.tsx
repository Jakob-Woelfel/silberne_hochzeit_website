'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/home', label: 'Start' },
  { href: '/bingo', label: 'Bingo' },
  { href: '/ranking', label: 'Ranking' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-[var(--border)] bg-[var(--surface)]">
      <ul className="mx-auto flex w-full max-w-xl">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[56px] items-center justify-center px-2 text-[15px] font-medium ${
                  active
                    ? 'text-[var(--accent-strong)] font-semibold'
                    : 'text-[var(--muted)]'
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
