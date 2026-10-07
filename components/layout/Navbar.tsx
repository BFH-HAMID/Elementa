'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { BookOpen, FlaskConical, Home, Menu, X, Atom, Bookmark, Sparkles, ChevronDown, Beaker } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
  const common = useTranslations('common');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [subjectsOpen, setSubjectsOpen] = useState(false);
  const hrefFor = (href: string) => `/${locale}${href === '/' ? '' : href}`;
  const subjectLinks = [
    { key: 'physics', href: '/physics', icon: Atom },
    { key: 'chemistry', href: '/chemistry', icon: FlaskConical }
  ] as const;
  const subjectActive = subjectLinks.some(({ href }) => pathname === hrefFor(href));
  const isActive = (href: string) => href === '/' ? pathname === `/${locale}` : pathname.startsWith(`/${locale}${href}`);

  // Any navigation should collapse both menus, and Escape closes the phone sheet.
  useEffect(() => { setSubjectsOpen(false); setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [mobileOpen]);

  // Click-away closes the desktop subjects dropdown.
  const subjectMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!subjectsOpen) return;
    const close = (event: MouseEvent) => {
      if (subjectMenuRef.current && !subjectMenuRef.current.contains(event.target as Node)) setSubjectsOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [subjectsOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--background)]/90 backdrop-blur-xl">
      <div className="page-shell flex h-16 items-center justify-between gap-3">
        <Logo />
        <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary navigation">
          {links.map(({ key, href, icon: Icon }) => {
            const active = isActive(href);
            return <Link key={key} href={hrefFor(href)} className={cn('flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition', active ? 'bg-physics-100 text-physics-700 dark:bg-physics-900 dark:text-physics-100' : 'text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]')}><Icon size={15} />{t(key)}</Link>;
          })}
          <div className="relative" ref={subjectMenuRef}>
            <button type="button" aria-haspopup="menu" aria-expanded={subjectsOpen} aria-controls="desktop-subject-menu" onClick={() => setSubjectsOpen((value) => !value)} className={cn('flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition', subjectActive || subjectsOpen ? 'bg-physics-100 text-physics-700 dark:bg-physics-900 dark:text-physics-100' : 'text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]')}>
              <Atom size={15} />{t('subjects')}<ChevronDown size={14} className={cn('transition', subjectsOpen && 'rotate-180')} />
            </button>
            {subjectsOpen && <div id="desktop-subject-menu" role="menu" className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-2 shadow-float">
              {subjectLinks.map(({ key, href, icon: Icon }) => <Link key={key} role="menuitem" href={hrefFor(href)} onClick={() => setSubjectsOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]"><Icon size={17} className={key === 'physics' ? 'text-physics-600' : 'text-chemistry-600'} />{common(key)}</Link>)}
            </div>}
          </div>
          <Link href={hrefFor('/lab/physics')} aria-current={isActive('/lab/physics') ? 'page' : undefined} className={cn('ml-1 flex items-center gap-1.5 rounded-lg bg-physics-600 px-3 py-2 text-sm font-black text-white shadow-sm transition hover:bg-physics-700 dark:bg-physics-600 dark:hover:bg-physics-500', isActive('/lab/physics') && 'ring-2 ring-physics-300 dark:ring-physics-700')}><Atom size={15} />{t('physicsLab')}</Link>
          <Link href={hrefFor('/lab/chemistry')} aria-current={isActive('/lab/chemistry') ? 'page' : undefined} className={cn('flex items-center gap-1.5 rounded-lg bg-chemistry-600 px-3 py-2 text-sm font-black text-white shadow-sm transition hover:bg-chemistry-700 dark:bg-chemistry-600 dark:hover:bg-chemistry-500', isActive('/lab/chemistry') && 'ring-2 ring-chemistry-300 dark:ring-chemistry-700')}><Beaker size={15} />{t('chemistryLab')}</Link>
        </nav>
        <div className="flex items-center gap-1">
          <CommandPalette />
          <Link href={hrefFor('/lab/physics')} className="btn-ghost min-h-9 rounded-lg p-2 text-physics-600 dark:text-physics-300 xl:hidden" aria-label={t('physicsLab')}><Atom size={17} /></Link>
          <Link href={hrefFor('/lab/chemistry')} className="btn-ghost min-h-9 rounded-lg p-2 text-chemistry-600 dark:text-chemistry-200 xl:hidden" aria-label={t('chemistryLab')}><Beaker size={17} /></Link>
          <Link href={hrefFor('/bookmarks')} className="btn-ghost min-h-9 rounded-lg p-2" aria-label={t('bookmarks')}><Bookmark size={17} /></Link>
          <LangSwitch /><ThemeToggle />
          <button type="button" className="btn-ghost min-h-9 rounded-lg p-2 xl:hidden" onClick={() => setMobileOpen((value) => !value)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {mobileOpen && <nav className="border-t border-[var(--line)] bg-[var(--surface)] xl:hidden" aria-label="Mobile navigation">
        <div className="page-shell grid max-h-[calc(100dvh-4rem)] grid-cols-2 gap-2 overflow-y-auto pt-3 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:grid-cols-4">
          {links.map(({ key, href, icon: Icon }) => { const active = isActive(href); return <Link key={key} href={hrefFor(href)} onClick={() => setMobileOpen(false)} aria-current={active ? 'page' : undefined} className={cn('flex items-center gap-2 rounded-xl p-3 text-sm font-bold transition', active ? 'bg-physics-50 text-physics-700 dark:bg-physics-900/60 dark:text-physics-100' : 'text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]')}><Icon size={17} />{t(key)}</Link>; })}
          <Link href={hrefFor('/lab/physics')} onClick={() => setMobileOpen(false)} aria-current={isActive('/lab/physics') ? 'page' : undefined} className={cn('col-span-1 flex items-center gap-2 rounded-xl p-3 text-sm font-black text-white transition sm:col-span-2', isActive('/lab/physics') ? 'bg-physics-700' : 'bg-physics-600 hover:bg-physics-700')}><Atom size={17} />{t('physicsLab')}</Link>
          <Link href={hrefFor('/lab/chemistry')} onClick={() => setMobileOpen(false)} aria-current={isActive('/lab/chemistry') ? 'page' : undefined} className={cn('col-span-1 flex items-center gap-2 rounded-xl p-3 text-sm font-black text-white transition sm:col-span-2', isActive('/lab/chemistry') ? 'bg-chemistry-700' : 'bg-chemistry-600 hover:bg-chemistry-700')}><Beaker size={17} />{t('chemistryLab')}</Link>
          <Link href={hrefFor('/constants')} onClick={() => setMobileOpen(false)} className={cn('flex items-center gap-2 rounded-xl p-3 text-sm font-bold transition', pathname.startsWith(hrefFor('/constants')) ? 'bg-physics-50 text-physics-700 dark:bg-physics-900/60 dark:text-physics-100' : 'text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]')}><Atom size={17} />{t('constants')}</Link>
          {subjectLinks.map(({ key, href, icon: Icon }) => { const active = pathname === hrefFor(href); return <Link key={key} href={hrefFor(href)} onClick={() => setMobileOpen(false)} aria-current={active ? 'page' : undefined} className={cn('flex items-center gap-2 rounded-xl p-3 text-sm font-bold transition', active ? 'bg-physics-50 text-physics-700 dark:bg-physics-900/60 dark:text-physics-100' : 'text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]')}><Icon size={17} />{common(key)}</Link>; })}
        </div>
      </nav>}
    </header>
  );
}
