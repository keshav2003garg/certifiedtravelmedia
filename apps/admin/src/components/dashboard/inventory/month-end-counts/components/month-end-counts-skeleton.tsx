import { memo } from 'react';

import { Skeleton } from '@repo/ui/components/base/skeleton';

function MonthEndCountsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="grid gap-4 rounded-md border p-4 lg:grid-cols-[1.5fr_80px_140px_140px_120px_100px_100px]"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

export default memo(MonthEndCountsSkeleton);
