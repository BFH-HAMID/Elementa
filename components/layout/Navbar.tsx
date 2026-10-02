'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { BookOpen, FlaskConical, Home, Menu, X, Atom, Bookmark, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { CommandPalette } from './CommandPalette';
import { LangSwitch } from './LangSwitch';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

const links = [
  { key: 'home', href: '/', icon: Home },
  { key: 'equations', href: '/equations', icon: BookOpen },
  { key: 'experiments', href: '/experiments', icon: FlaskConical },
  { key: 'simulations', href: '/simulations', icon: Sparkles },
  { key: 'quiz', href: '/quiz', icon: Atom }
] as const;

export function Logo() {
  const locale = useLocale();
  return <Link href={`/${locale}`} className="flex shrink-0 items-center gap-2.5" aria-label="PhysChem Lab home"><span className="grid h-9 w-9 place-items-center rounded-xl bg-physics-600 text-white shadow-sm"><span className="text-lg font-black">∫</span></span><span className="hidden text-sm font-black tracking-tight text-[var(--ink)] xs:inline sm:text-base">PhysChem <span className="text-chemistry-600 dark:text-chemistry-200">Lab</span></span></Link>;
}

export function Navbar() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('nav');
  const [mobileOpen, setMobileOpen] = useState(false);
  const hrefFor = (href: string) => `/${locale}${href === '/' ? '' : href}`;
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--background)]/90 backdrop-blur-xl">
      <div className="page-shell flex h-16 items-center justify-between gap-3">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {links.map(({ key, href, icon: Icon }) => {
            const active = href === '/' ? pathname === `/${locale}` : pathname.startsWith(`/${locale}${href}`);
            return <Link key={key} href={hrefFor(href)} className={cn('flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition', active ? 'bg-physics-100 text-physics-700 dark:bg-physics-900 dark:text-physics-100' : 'text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]')}><Icon size={15} />{t(key)}</Link>;
          })}
        </nav>
        <div className="flex items-center gap-1">
          <CommandPalette />
          <Link href={hrefFor('/bookmarks')} className="btn-ghost min-h-9 rounded-lg p-2" aria-label={t('bookmarks')}><Bookmark size={17} /></Link>
          <LangSwitch /><ThemeToggle />
          <button type="button" className="btn-ghost min-h-9 rounded-lg p-2 lg:hidden" onClick={() => setMobileOpen((value) => !value)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {mobileOpen && <nav className="border-t border-[var(--line)] bg-[var(--surface)] p-3 lg:hidden" aria-label="Mobile navigation">
        <div className="page-shell grid grid-cols-2 gap-2 sm:grid-cols-5">
          {links.map(({ key, href, icon: Icon }) => <Link key={key} href={hrefFor(href)} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-xl p-3 text-sm font-bold text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]"><Icon size={17} />{t(key)}</Link>)}
          <Link href={hrefFor('/constants')} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-xl p-3 text-sm font-bold text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]"><Atom size={17} />{t('constants')}</Link>
        </div>
      </nav>}
    </header>
  );
}
