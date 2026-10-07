import { redirect } from 'next/navigation';
import { defaultLocale } from '@/i18n/routing';

export default function PhysicsExperimentRedirectPage({ params }: { params: { slug: string } }) {
  redirect(`/${defaultLocale}/experiments/physics/${params.slug}`);
}
