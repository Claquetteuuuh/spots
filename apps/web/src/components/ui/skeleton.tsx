/**
 * Loading placeholders. They mirror the radii of the real thing they stand in
 * for, so nothing jumps shape when the content lands.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-bg-secondary ${className}`} />;
}

/** Card-shaped skeleton for spot cards in the feed (square on a phone, like the card). */
export function SpotCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-square rounded-none sm:aspect-[4/5] sm:rounded-2xl" />
      <div className="space-y-2 px-4 pt-3 sm:px-1">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}

/**
 * Grid-cell skeleton for profile spot grids: the app's three-column,
 * 1px-gutter, square-cornered grid below `lg`, the rounded tiles above.
 */
export function SpotGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-px lg:gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-none lg:rounded-xl" />
      ))}
    </div>
  );
}

/** Profile header skeleton: 80px avatar with the stats beside it, like the app. */
export function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
      <div className="flex flex-1 justify-around">
        <Skeleton className="h-10 w-12" />
        <Skeleton className="h-10 w-12" />
        <Skeleton className="h-10 w-12" />
      </div>
    </div>
  );
}
