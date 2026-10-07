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
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--surface)]/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur-xl xl:hidden"
      aria-label="Mobile bottom navigation"
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {items.map(({ key, href, icon: Icon }) => {
          const target = `/${locale}${href}`;
          const active = href ? pathname.startsWith(target) : pathname === `/${locale}`;
          return (
            <Link
              key={key}
              href={target}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-[52px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-1.5 text-[10px] font-bold leading-tight',
                active ? 'bg-physics-50 text-physics-600 dark:bg-physics-900/60 dark:text-physics-200' : 'text-[var(--muted)]'
              )}
            >
              <Icon size={19} strokeWidth={active ? 2.6 : 2} />
              <span className="w-full truncate text-center">{t(key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
