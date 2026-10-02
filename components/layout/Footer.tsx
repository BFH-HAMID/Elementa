'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Github, Heart, ShieldCheck } from 'lucide-react';

export function Footer() {
  const locale = useLocale();
  const t = useTranslations();
  return <footer className="mt-16 border-t border-[var(--line)] bg-[var(--surface)]">
    <div className="page-shell grid gap-8 py-10 sm:grid-cols-[1.5fr_1fr_1fr]">
      <div><div className="mb-3 flex items-center gap-2 font-black"><span className="grid h-8 w-8 place-items-center rounded-lg bg-physics-600 text-white">∫</span>PhysChem Lab</div><p className="max-w-sm text-sm leading-6 muted">{t('footer.built')}.</p></div>
      <div><p className="mb-3 text-xs font-black uppercase tracking-widest text-[var(--muted)]">Learn</p><div className="grid gap-2 text-sm font-bold text-[var(--muted)]"><Link href={`/${locale}/equations`} className="hover:text-physics-600">{t('nav.equations')}</Link><Link href={`/${locale}/experiments`} className="hover:text-physics-600">{t('nav.experiments')}</Link><Link href={`/${locale}/simulations`} className="hover:text-physics-600">{t('nav.simulations')}</Link></div></div>
      <div><p className="mb-3 text-xs font-black uppercase tracking-widest text-[var(--muted)]">Project</p><div className="grid gap-2 text-sm font-bold text-[var(--muted)]"><Link href={`/${locale}/about`} className="hover:text-physics-600">{t('nav.about')}</Link><a href="https://github.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-physics-600"><Github size={15} />GitHub</a><span className="inline-flex items-center gap-2"><ShieldCheck size={15} />{t('footer.license')}</span></div></div>
    </div>
    <div className="border-t border-[var(--line)]"><div className="page-shell flex flex-col gap-2 py-4 text-xs muted sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} PhysChem Lab</span><span className="inline-flex items-center gap-1">Made with <Heart size={12} className="fill-coral text-coral" /> for learning</span></div></div>
  </footer>;
}
