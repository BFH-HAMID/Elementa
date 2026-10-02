import { CardSkeleton } from '@/components/ui/Skeleton';

export default function Loading() { return <section className="page-shell section-space"><div className="mb-8 space-y-3"><div className="h-3 w-28 animate-pulse rounded bg-[var(--surface-soft)]" /><div className="h-12 w-2/3 animate-pulse rounded-xl bg-[var(--surface-soft)]" /><div className="h-5 w-full max-w-xl animate-pulse rounded bg-[var(--surface-soft)]" /></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div></section>; }
