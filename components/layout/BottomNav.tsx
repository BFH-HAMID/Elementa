'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { BookOpen, FlaskConical, Home, Sparkles, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('nav');
  const items = [
    { key: 'home', href: '', icon: Home },
    { key: 'equations', href: '/equations', icon: BookOpen },
    { key: 'experiments', href: '/experiments', icon: FlaskConical },
    { key: 'simulations', href: '/simulations', icon: Sparkles },
    { key: 'quiz', href: '/quiz', icon: Trophy }
  ] as const;
  return <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--surface)]/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-xl lg:hidden" aria-label="Mobile bottom navigation"><div className="mx-auto grid max-w-md grid-cols-5">{items.map(({ key, href, icon: Icon }) => { const target = `/${locale}${href}`; const active = href ? pathname.startsWith(target) : pathname === `/${locale}`; return <Link key={key} href={target} className={cn('flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-bold', active ? 'text-physics-600 dark:text-physics-200' : 'text-[var(--muted)]')}><Icon size={18} strokeWidth={active ? 2.6 : 2} /><span>{t(key)}</span></Link>; })}</div></nav>;
}
