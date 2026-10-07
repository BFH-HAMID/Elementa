'use client';

/* The public GitHub profile photo is intentionally loaded directly by the browser. */
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { developerProfile } from '@/lib/developer-profile';

export function DeveloperPhoto({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        'relative grid place-items-center overflow-hidden bg-gradient-to-br from-physics-600 to-chemistry-500 text-2xl font-black text-white shadow-card',
        className
      )}
    >
      {failed ? (
        <span role="img" aria-label="Md. Abdul Hamid Anower">HA</span>
      ) : (
        <img
          src={developerProfile.avatarUrl}
          alt="Md. Abdul Hamid Anower"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
