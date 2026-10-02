'use client';

import Link from 'next/link';
import { Compass, Home } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function NotFound() { const t = useTranslations('errors'); return <section className="page-shell grid min-h-[65vh] place-items-center py-16 text-center"><div><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-physics-100 text-physics-700 dark:bg-physics-900 dark:text-physics-100"><Compass size={30} /></span><p className="mt-6 text-sm font-black uppercase tracking-widest text-physics-600">404 · Lab notebook</p><h1 className="mt-3 text-3xl font-black">{t('notFound')}</h1><p className="mt-3 text-sm muted">The address may have moved, but the next experiment is close.</p><Link href="/bn" className="btn-primary mt-6"><Home size={16} />{t('home')}</Link></div></section>; }
