import { redirect } from 'next/navigation';
import { isLocale, defaultLocale } from '@/i18n/routing';

export default function LabExperimentsRedirect({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  redirect(`/${locale}/lab/chemistry/experiments`);
}
