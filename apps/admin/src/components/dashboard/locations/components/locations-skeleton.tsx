import { memo } from 'react';

import { Skeleton } from '@repo/ui/components/base/skeleton';

interface LocationsSkeletonProps {
  variant?: 'list' | 'sector';
}

function LocationsSkeleton({ variant = 'list' }: LocationsSkeletonProps) {
  if (variant === 'sector') {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="bg-card rounded-md border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="hidden size-10 rounded-md sm:block" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
              <Skeleton className="h-7 w-28 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="bg-muted/40 grid grid-cols-[1.6fr_1.8fr_1.4fr_0.8fr_0.8fr] gap-4 border-b p-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="hidden h-4 w-20 md:block" />
        <Skeleton className="hidden h-4 w-14 lg:block" />
        <Skeleton className="h-4 w-12 justify-self-end" />
      </div>
      <div className="divide-y">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="grid grid-cols-[1.6fr_1.8fr_1.4fr_0.8fr_0.8fr] gap-4 p-4"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="hidden space-y-2 md:block">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="hidden h-6 w-32 md:block" />
            <Skeleton className="hidden h-6 w-14 lg:block" />
            <Skeleton className="h-8 w-20 justify-self-end" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(LocationsSkeleton);
