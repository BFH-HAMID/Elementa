import type { Metadata } from 'next';
import { DeveloperInfo } from '@/components/developer/DeveloperInfo';

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const isBangla = params.locale === 'bn';
  return {
    title: isBangla ? 'ডেভেলপার পরিচিতি' : 'Developer information',
    description: isBangla
      ? 'PhysChem Lab-এর ডেভেলপার এবং তাঁর কাজের সঙ্গে পরিচিত হন।'
      : 'Meet the developer behind PhysChem Lab and explore his work.'
  };
}

export default function DeveloperPage() {
  return <DeveloperInfo />;
}
