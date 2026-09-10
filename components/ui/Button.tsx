'use client';

import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

/** Volle Breite, mindestens 56 px hoch (Kickoff §9). */
export function Button({ variant = 'primary', className = '', ...rest }: Props) {
  const base =
    'w-full min-h-[56px] rounded-xl px-5 font-semibold transition active:scale-[0.99] disabled:opacity-45 disabled:active:scale-100';
  const styles = {
    primary: 'bg-[var(--accent)] text-white shadow-sm',
    secondary: 'bg-white text-[var(--foreground)] border border-[var(--border)]',
    ghost: 'bg-transparent text-[var(--muted)]',
  }[variant];

  return <button className={`${base} ${styles} ${className}`} {...rest} />;
}
