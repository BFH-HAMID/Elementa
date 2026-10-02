import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('relative overflow-hidden rounded-xl bg-[var(--surface-soft)] before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent', className)} />;
}

export function CardSkeleton() {
  return <div className="card space-y-4 p-5"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-6 w-4/5" /><Skeleton className="h-16 w-full" /><Skeleton className="h-10 w-1/2" /></div>;
}
