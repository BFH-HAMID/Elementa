'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { BookOpen, FlaskConical, Gauge, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar({ className, active }: { className?: string; active?: 'equations' | 'experiments' | 'simulations' }) {
  const locale = useLocale(); const t = useTranslations('nav');
  const items = [{ key: 'equations', href: '/equations', icon: BookOpen }, { key: 'experiments', href: '/experiments', icon: FlaskConical }, { key: 'simulations', href: '/simulations', icon: Gauge }] as const;
  return <aside className={cn('rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4', className)}><div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest muted"><SlidersHorizontal size={14} />Explore</div><nav className="grid gap-1">{items.map(({ key, href, icon: Icon }) => <Link key={key} href={`/${locale}${href}`} className={cn('flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition', active === key ? 'bg-physics-100 text-physics-700 dark:bg-physics-900 dark:text-physics-100' : 'text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]')}><Icon size={17} />{t(key)}</Link>)}</nav></aside>;
}
