/**
 * Skeleton placeholder for loading states.
 * Uses a subtle shimmer animation in the design-system palette.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-sm bg-bg-secondary ${className}`}
    />
  );
}

/** Card-shaped skeleton for spot cards in the feed. */
export function SpotCardSkeleton() {
  return (
    <div className="border border-border rounded-sm overflow-hidden">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="px-4 py-3 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/4" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
      </div>
    </div>
  );
}

/** Grid-cell skeleton for profile spot grids. */
export function SpotGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-square" />
      ))}
    </div>
  );
}

/** Profile header skeleton. */
export function ProfileSkeleton() {
  return (
    <div className="flex items-start gap-6">
      <Skeleton className="h-20 w-20 shrink-0" />
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
