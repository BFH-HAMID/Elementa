'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import {
  ArrowUpRight,
  Atom,
  Bookmark,
  Globe2,
  Github,
  Info,
  MoreVertical,
  UserRound
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { DeveloperPhoto } from '@/components/developer/DeveloperPhoto';
import { developerProfile } from '@/lib/developer-profile';
import { cn } from '@/lib/utils';

export function DeveloperMenu() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('developer');
  const nav = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const quickLinks = [
    { href: '/constants', label: nav('constants'), icon: Atom },
    { href: '/bookmarks', label: nav('bookmarks'), icon: Bookmark },
    { href: '/about', label: nav('about'), icon: Info }
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className={cn(
          'btn-ghost min-h-10 min-w-10 rounded-lg p-2',
          open && 'bg-[var(--surface-soft)] text-[var(--ink)]'
        )}
        onClick={() => setOpen((value) => !value)}
        aria-label={t('menuLabel')}
        title={t('menuLabel')}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="more-menu"
      >
        <MoreVertical size={19} />
      </button>

      {open && (
        <div
          id="more-menu"
          role="region"
          aria-label={t('menuLabel')}
          className="absolute right-0 top-full z-[60] mt-2 max-h-[calc(100dvh-6rem)] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-float"
        >
          <div className="p-4">
            <div className="flex min-w-0 items-center gap-3">
              <DeveloperPhoto className="h-14 w-14 shrink-0 rounded-2xl" />
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-wider text-physics-600 dark:text-physics-200">
                  {t('information')}
                </p>
                <p className="mt-1 break-words text-sm font-extrabold leading-5 text-[var(--ink)]">
                  {t('name')}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 muted">{t('role')}</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 muted">{t('shortBio')}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <a
                href={developerProfile.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary min-h-10 min-w-0 px-2 text-xs"
              >
                <Globe2 size={15} className="shrink-0" />
                <span className="truncate">{t('portfolio')}</span>
                <ArrowUpRight size={13} className="shrink-0" />
              </a>
              <a
                href={developerProfile.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary min-h-10 min-w-0 px-2 text-xs"
              >
                <Github size={16} className="shrink-0" />
                <span className="truncate">{t('github')}</span>
                <ArrowUpRight size={13} className="shrink-0" />
              </a>
            </div>
          </div>

          <div className="border-t border-[var(--line)] p-2">
            <Link
              href={`/${locale}/developer`}
              onClick={() => setOpen(false)}
              aria-current={pathname.startsWith(`/${locale}/developer`) ? 'page' : undefined}
              className="flex min-h-11 items-center gap-2 rounded-xl bg-physics-50 px-3 py-2.5 text-sm font-extrabold text-physics-700 transition hover:bg-physics-100 dark:bg-physics-900/60 dark:text-physics-100 dark:hover:bg-physics-900"
            >
              <UserRound size={17} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate">{t('information')}</span>
              <ArrowUpRight size={15} className="shrink-0" />
            </Link>
            <div className="mt-1 grid grid-cols-2 gap-1">
              {quickLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={`/${locale}${href}`}
                  onClick={() => setOpen(false)}
                  aria-current={pathname.startsWith(`/${locale}${href}`) ? 'page' : undefined}
                  className="flex min-h-10 min-w-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]"
                >
                  <Icon size={15} className="shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
