'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';
import { useLabStore } from '@/lib/store';

export function LangSwitch() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const setLanguage = useLabStore((state) => state.setLanguage);
  const next = locale === 'bn' ? 'en' : 'bn';
  const switchLanguage = () => {
    setLanguage(next);
    const nextPath = pathname.replace(/^\/(bn|en)(?=\/|$)/, `/${next}`);
    router.push(nextPath || `/${next}`);
  };
  return (
    <button type="button" onClick={switchLanguage} className="btn-ghost min-h-9 gap-1.5 rounded-lg px-2.5 text-xs" aria-label={locale === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}>
      <Languages size={16} />
      <span className="font-extrabold">{locale === 'bn' ? 'EN' : 'বাং'}</span>
    </button>
  );
}
