/**
 * Loading placeholders. They mirror the radii of the real thing they stand in
 * for, so nothing jumps shape when the content lands.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-bg-secondary ${className}`} />;
}

/** Card-shaped skeleton for spot cards in the feed. */
export function SpotCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[4/5] rounded-2xl" />
      <div className="space-y-2 px-1 pt-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}

/** Grid-cell skeleton for profile spot grids. */
export function SpotGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-xl" />
      ))}
    </div>
  );
}

/** Profile header skeleton. */
export function ProfileSkeleton() {
  return (
    <div className="flex items-start gap-6">
      <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-6 pt-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}
