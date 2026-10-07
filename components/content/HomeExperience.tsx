'use client';

import Link from 'next/link';
import { motion, MotionConfig, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Atom, BookOpen, FlaskConical, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLabStore } from '@/lib/store';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import type { SimulationMeta } from '@/lib/simulations';

function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (current) => Math.round(current).toString());

  useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);

  return <motion.span>{display}</motion.span>;
}

export function HomeExperience({
  counts,
  simulations
}: {
  counts: { equations: number; experiments: number };
  simulations: SimulationMeta[];
}) {
  const locale = useLocale() as 'bn' | 'en';
  const t = useTranslations();
  const [mounted, setMounted] = useState(false);
  const recent = useLabStore((state) => state.recentlyViewed);

  useEffect(() => setMounted(true), []);

  const href = (path: string) => `/${locale}${path}`;
  const cards = [
    {
      href: '/equations',
      icon: BookOpen,
      tone: 'physics' as const,
      title: t('home.equationCard'),
      description: t('equations.subtitle')
    },
    {
      href: '/experiments',
      icon: FlaskConical,
      tone: 'chemistry' as const,
      title: t('home.experimentCard'),
      description: t('experiments.subtitle')
    },
    {
      href: '/simulations',
      icon: Sparkles,
      tone: 'warm' as const,
      title: t('home.simulationCard'),
      description: t('simulations.subtitle')
    }
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="hero-glow relative overflow-hidden border-b border-[var(--line)]">
        <div className="pointer-events-none absolute inset-0 grid-dots opacity-60" />
        {/* Decorative formulae stay away from the phone headings. */}
        <span className="pointer-events-none absolute left-[7%] top-20 hidden animate-drift text-5xl font-black text-physics-500/10 sm:block">
          F = ma
        </span>
        <span className="pointer-events-none absolute right-[12%] top-36 hidden animate-drift-slow text-4xl font-black text-chemistry-500/10 sm:block">
          pH
        </span>
        <span className="pointer-events-none absolute bottom-8 left-[45%] hidden animate-pulse-soft text-3xl font-black text-sun/30 sm:block">
          λ
        </span>

        <div className="page-shell relative section-space lg:py-24">
          <div className="grid min-w-0 items-center gap-8 sm:gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)]">
            <motion.div
              className="min-w-0"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <p className="eyebrow">{t('home.eyebrow')}</p>
              <h1 className="display-title mt-4 max-w-3xl">{t('home.title')}</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 muted sm:text-lg">
                {t('home.description')}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href={href('/simulations')} className="btn-primary">
                  {t('home.primaryCta')} <ArrowRight size={17} />
                </Link>
                <Link href={href('/equations')} className="btn-secondary">
                  {t('home.secondaryCta')}
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                <Badge tone="physics">{t('home.physicsPill')}</Badge>
                <Badge tone="chemistry">{t('home.chemistryPill')}</Badge>
              </div>
            </motion.div>

            <motion.div
              className="relative min-w-0"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.65, delay: 0.1 }}
            >
              <div className="card relative overflow-hidden p-4 sm:p-7">
                <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-physics-100 blur-2xl dark:bg-physics-900" />
                <div className="absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-chemistry-100 blur-2xl dark:bg-chemistry-900" />
                <div className="relative min-w-0">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <span className="text-xs font-black uppercase tracking-[.18em] muted">
                      {t('home.quickStart')}
                    </span>
                    <Atom size={20} className="shrink-0 text-chemistry-600" />
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-2xl bg-physics-50 p-4 dark:bg-physics-900/70">
                      <p className="text-xs font-bold text-physics-700 dark:text-physics-100">Newton</p>
                      <p className="mt-2 text-2xl font-black text-physics-900 dark:text-white">F = ma</p>
                      <p className="mt-1 text-xs muted">Force becomes visible.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
                      <div className="min-w-0 rounded-2xl bg-chemistry-50 p-3 dark:bg-chemistry-900/70 sm:p-4">
                        <p className="text-xs font-bold text-chemistry-700 dark:text-chemistry-100">Acid</p>
                        <p className="mt-2 break-words text-base font-black text-chemistry-900 dark:text-white sm:text-xl">
                          pH = −log[H⁺]
                        </p>
                      </div>
                      <div className="min-w-0 rounded-2xl bg-amber-50 p-3 dark:bg-amber-950/60 sm:p-4">
                        <p className="text-xs font-bold text-amber-800 dark:text-amber-200">Gas</p>
                        <p className="mt-2 break-words text-base font-black text-amber-950 dark:text-white sm:text-xl">
                          PV = nRT
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-[var(--line)] pt-6 sm:mt-14 sm:grid-cols-4">
            <Stat value={counts.equations} label={t('home.stats.equations')} />
            <Stat value={counts.experiments} label={t('home.stats.experiments')} />
            <Stat value={simulations.length} label={t('home.stats.simulations')} />
            <Stat value={2} label={t('home.stats.languages')} />
          </div>
        </div>
      </div>

      <SubjectDirectory />

      <section className="page-shell section-space">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{t('home.quickStart')}</p>
            <h2 className="section-title mt-2">{t('home.why')}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 muted">{t('home.whyText')}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ href: path, icon: Icon, tone, title, description }, index) => (
            <motion.div
              key={path}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: index * 0.08 }}
            >
              <Link href={href(path)} className="group block h-full">
                <Card className="card-hover h-full p-5">
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-xl ${
                      tone === 'physics'
                        ? 'bg-physics-100 text-physics-700 dark:bg-physics-900 dark:text-physics-100'
                        : tone === 'chemistry'
                          ? 'bg-chemistry-100 text-chemistry-700 dark:bg-chemistry-900 dark:text-chemistry-100'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-100'
                    }`}
                  >
                    <Icon size={21} />
                  </span>
                  <h3 className="mt-5 text-lg font-extrabold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 muted">{description}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-black text-physics-600 transition group-hover:gap-2 dark:text-physics-200">
                    {t('common.explore')} <ArrowRight size={15} />
                  </span>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {mounted && recent.length > 0 && (
        <section className="page-shell space-y-6 pb-14">
          <div className="card flex flex-col gap-4 border-physics-200 bg-physics-50 p-5 dark:border-physics-700 dark:bg-physics-900/50 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="eyebrow">{t('home.continue')}</p>
              <p className="mt-2 break-words text-lg font-extrabold">{recent[0].title}</p>
              <p className="mt-1 text-sm muted">Pick up your last visit without losing the thread.</p>
            </div>
            <Link href={href(recent[0].href)} className="btn-primary shrink-0">
              {t('common.resume')} <ArrowRight size={16} />
            </Link>
          </div>
          <div>
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="section-title">{t('home.recent')}</h2>
              <Link href={href('/bookmarks')} className="shrink-0 text-sm font-bold text-physics-600 dark:text-physics-200">
                {t('common.viewAll')}
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {recent.slice(0, 4).map((item) => (
                <Link key={`${item.kind}-${item.slug}`} href={href(item.href)} className="card card-hover min-w-0 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider muted">{item.kind}</p>
                  <p className="mt-2 line-clamp-2 break-words text-sm font-extrabold">{item.title}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </MotionConfig>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-0 text-center sm:text-left">
      <p className="text-2xl font-black text-physics-700 dark:text-physics-200 sm:text-3xl">
        <AnimatedNumber value={value} />
        <span className="text-sun">+</span>
      </p>
      <p className="mt-1 break-words text-xs font-bold muted">{label}</p>
    </div>
  );
}

function SubjectDirectory() {
  const locale = useLocale() as 'bn' | 'en';
  const t = useTranslations('subjects');
  const subjects = [
    {
      href: `/${locale}/physics`,
      icon: Atom,
      name: t('physics.name'),
      title: t('physics.homeTitle'),
      description: t('physics.homeDescription'),
      focus: t('physics.focus'),
      tone: 'physics' as const
    },
    {
      href: `/${locale}/chemistry`,
      icon: FlaskConical,
      name: t('chemistry.name'),
      title: t('chemistry.homeTitle'),
      description: t('chemistry.homeDescription'),
      focus: t('chemistry.focus'),
      tone: 'chemistry' as const
    }
  ];

  return (
    <section className="page-shell pt-10 sm:pt-12" aria-labelledby="subject-directory-title">
      <div className="mb-5 max-w-3xl">
        <p className="eyebrow">{t('directoryEyebrow')}</p>
        <h2 id="subject-directory-title" className="section-title mt-2">{t('directoryTitle')}</h2>
        <p className="mt-2 text-sm leading-6 muted">{t('directoryDescription')}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {subjects.map(({ href, icon: Icon, name, title, description, focus, tone }) => (
          <Link key={href} href={href} className="group block h-full">
            <Card className={`card-hover h-full border-l-4 p-5 sm:p-6 ${tone === 'physics' ? 'border-l-physics-500' : 'border-l-chemistry-500'}`}>
              <div className="flex items-start justify-between gap-4">
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${tone === 'physics' ? 'bg-physics-100 text-physics-700 dark:bg-physics-900 dark:text-physics-100' : 'bg-chemistry-100 text-chemistry-700 dark:bg-chemistry-900 dark:text-chemistry-100'}`}>
                  <Icon size={23} />
                </span>
                <Badge tone={tone}>{name}</Badge>
              </div>
              <h3 className="mt-5 text-xl font-extrabold">{title}</h3>
              <p className="mt-2 text-sm leading-6 muted">{description}</p>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
                <span className="text-xs font-bold muted">{focus}</span>
                <span className={`inline-flex items-center gap-1 text-sm font-black transition group-hover:gap-2 ${tone === 'physics' ? 'text-physics-700 dark:text-physics-200' : 'text-chemistry-700 dark:text-chemistry-200'}`}>
                  {t('openHub')} <ArrowRight size={15} />
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
