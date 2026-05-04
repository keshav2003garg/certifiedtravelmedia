import { memo } from 'react';

import { Skeleton } from '@repo/ui/components/base/skeleton';

function MonthEndCountsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="grid gap-4 rounded-md border p-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_120px_120px_150px_120px]"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

export default memo(MonthEndCountsSkeleton);
