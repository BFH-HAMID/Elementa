import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { AppShell } from '@/components/layout/AppShell';
import { locales, isLocale, type Locale } from '@/i18n/routing';
import bnMessages from '@/messages/bn.json';
import enMessages from '@/messages/en.json';

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const isBangla = params.locale === 'bn';
  return { title: isBangla ? 'PhysChem Lab — শিখুন, দেখুন, চেষ্টা করুন' : 'PhysChem Lab — Learn it. See it. Try it', description: isBangla ? 'বাংলাদেশের শিক্ষার্থীদের জন্য বিনামূল্যের বাংলা-ইংরেজি বিজ্ঞান ল্যাব।' : 'A free bilingual science lab for learners in Bangladesh.' };
}

export default function LocaleLayout({ children, params }: Readonly<{ children: React.ReactNode; params: { locale: string } }>) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const messages = locale === 'bn' ? bnMessages : enMessages;
  return <NextIntlClientProvider locale={locale} now={new Date(0)} timeZone="UTC" messages={messages}><AppShell>{children}</AppShell></NextIntlClientProvider>;
}
