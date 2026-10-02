import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { LinkButton } from '@/components/ui/Button';
import type { Locale } from '@/i18n/routing';
import { phetEmbedUrl, type PhetSimulationMeta } from '@/lib/phet-simulations';

export function PhetSimulationEmbed({ simulation, locale }: { simulation: PhetSimulationMeta; locale: Locale }) {
  const isBangla = locale === 'bn';
  const src = phetEmbedUrl(simulation.slug);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>PhET · HTML5</Badge>
          {simulation.subjects.map((subject) => (
            <Badge key={subject} tone={subject === 'physics' ? 'physics' : 'chemistry'}>
              {subject === 'physics' ? (isBangla ? 'পদার্থবিজ্ঞান' : 'Physics') : (isBangla ? 'রসায়ন' : 'Chemistry')}
            </Badge>
          ))}
        </div>
        <LinkButton variant="secondary" href={src} target="_blank" rel="noreferrer" icon={<ExternalLink size={16} />}>
          {isBangla ? 'নতুন ট্যাবে খুলুন' : 'Open in a new tab'}
        </LinkButton>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm">
        <iframe
          src={src}
          title={`PhET Interactive Simulation: ${simulation.title}`}
          className="block h-[min(78vh,52rem)] min-h-[22rem] w-full border-0 bg-white sm:min-h-[34rem]"
          allow="fullscreen"
          allowFullScreen
          loading="eager"
        />
      </div>

      <p className="text-xs leading-5 muted">
        {isBangla ? 'সিমুলেশনটি সরাসরি PhET-এর সার্ভার থেকে চালু হয়েছে। ' : 'This simulation is served directly by PhET. '}
        {isBangla ? 'কাজ না করলে ' : 'If it does not load, '}
        <a className="font-bold text-physics-700 underline dark:text-physics-200" href={src} target="_blank" rel="noreferrer">
          {isBangla ? 'PhET-এ সরাসরি খুলুন' : 'open it directly on PhET'}
        </a>
        . {isBangla ? 'ইন্টারনেট সংযোগ প্রয়োজন।' : 'An internet connection is required.'}
      </p>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-4 text-xs leading-5 muted">
        <p>
          Simulation by PhET Interactive Simulations, University of Colorado Boulder, licensed under{' '}
          <a className="font-bold text-physics-700 underline dark:text-physics-200" href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noreferrer">
            CC BY-NC 4.0
          </a>{' '}
          (<a className="font-bold text-[var(--ink)] underline" href="https://phet.colorado.edu" target="_blank" rel="noreferrer">https://phet.colorado.edu</a>).
        </p>
        <p className="mt-1">
          {isBangla
            ? 'বাণিজ্যিক বা বিজ্ঞাপন-সমর্থিত ব্যবহারের জন্য PhET-এর আলাদা লাইসেন্স লাগতে পারে।'
            : 'Commercial or ad-supported use may require a separate license from PhET.'}
        </p>
      </div>
    </div>
  );
}
