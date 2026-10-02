'use client';

import { useEffect } from 'react';
import { RefreshCcw, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { const t = useTranslations(); useEffect(() => { /* Keep the error boundary intentionally quiet in production. */ }, []); return <section className="page-shell grid min-h-[65vh] place-items-center py-16 text-center"><div><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-100"><TriangleAlert size={30} /></span><h1 className="mt-6 text-3xl font-black">{t('errors.title')}</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 muted">{t('errors.text')}</p><Button className="mt-6" onClick={() => reset()} icon={<RefreshCcw size={16} />}>{t('common.tryAgain')}</Button></div></section>; }
