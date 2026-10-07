'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowLeft,
  ArrowUpRight,
  Cloud,
  Code2,
  Github,
  Globe2,
  Linkedin,
  Mail,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { DeveloperPhoto } from './DeveloperPhoto';
import { developerProfile, developerSkills } from '@/lib/developer-profile';

export function DeveloperInfo() {
  const locale = useLocale();
  const t = useTranslations('developer');
  const skillIcons = [ShieldCheck, ShieldCheck, ShieldCheck, Code2, Code2, Code2, Cloud];
  const links = [
    { label: t('portfolio'), href: developerProfile.portfolioUrl, icon: Globe2, external: true },
    { label: t('github'), href: developerProfile.githubUrl, icon: Github, external: true },
    { label: t('linkedin'), href: developerProfile.linkedinUrl, icon: Linkedin, external: true },
    { label: t('email'), href: `mailto:${developerProfile.email}`, icon: Mail, external: false }
  ];

  return (
    <section className="page-shell section-space">
      <div className="mb-9 max-w-3xl">
        <Link href={`/${locale}`} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--muted)] transition hover:text-physics-600">
          <ArrowLeft size={16} />
          PhysChem Lab
        </Link>
        <p className="eyebrow">PhysChem Lab · Developer</p>
        <h1 className="display-title mt-3">{t('pageTitle')}</h1>
        <p className="mt-4 text-base leading-7 muted">{t('pageDescription')}</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
        <Card className="overflow-hidden">
          <div className="hero-glow p-5 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <DeveloperPhoto className="h-24 w-24 shrink-0 rounded-3xl ring-4 ring-[var(--surface)] sm:h-28 sm:w-28" />
              <div className="min-w-0">
                <Badge tone="physics">{t('role')}</Badge>
                <h2 className="mt-3 break-words text-2xl font-black tracking-tight sm:text-3xl">
                  {t('name')}
                </h2>
                <p className="mt-2 flex items-center gap-1.5 text-sm font-bold muted">
                  <MapPin size={15} className="shrink-0" />
                  {t('location')}
                </p>
              </div>
            </div>
            <p className="mt-7 max-w-3xl text-sm leading-7 muted sm:text-base">{t('shortBio')}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {developerSkills.map((skill, index) => {
                const Icon = skillIcons[index];
                return (
                  <Badge key={skill} className="gap-1.5 border border-[var(--line)] bg-[var(--surface)]/80 px-3 py-1.5">
                    <Icon size={13} />
                    {skill}
                  </Badge>
                );
              })}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('contactTitle')}</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {links.map(({ label, href, icon: Icon, external }) => (
                <a
                  key={label}
                  href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noreferrer' : undefined}
                  className="flex min-h-12 min-w-0 items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm font-bold transition hover:border-physics-300 hover:bg-[var(--surface-soft)]"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-physics-50 text-physics-700 dark:bg-physics-900 dark:text-physics-100">
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  {external ? <ArrowUpRight size={15} className="shrink-0 muted" /> : <span className="truncate text-xs muted">{developerProfile.email}</span>}
                </a>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
