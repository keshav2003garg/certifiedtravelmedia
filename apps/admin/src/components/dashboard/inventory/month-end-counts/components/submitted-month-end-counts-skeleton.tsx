import { memo } from 'react';

import { Skeleton } from '@repo/ui/components/base/skeleton';

function SubmittedMonthEndCountsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="grid gap-4 rounded-md border p-4 lg:grid-cols-[1.6fr_1fr_100px_140px]"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16 justify-self-end" />
          <Skeleton className="h-5 w-24 justify-self-end" />
        </div>
      ))}
    </div>
  );
}

export default memo(SubmittedMonthEndCountsSkeleton);
