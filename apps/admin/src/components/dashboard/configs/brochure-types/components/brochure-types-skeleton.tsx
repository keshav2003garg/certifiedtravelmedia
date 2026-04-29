import { memo } from 'react';

import { Skeleton } from '@repo/ui/components/base/skeleton';

function BrochureTypesSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="grid gap-4 rounded-md border p-4 md:grid-cols-[1fr_120px_140px_140px_44px]"
        >
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-9" />
        </div>
      ))}
    </div>
  );
}

export default memo(BrochureTypesSkeleton);
