import { redirect } from 'next/navigation';
import { isLocale, defaultLocale } from '@/i18n/routing';

export default function PhysicsExperimentRedirect({ params }: { params: { locale: string; slug: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  redirect(`/${locale}/experiments/physics/${params.slug}`);
}
