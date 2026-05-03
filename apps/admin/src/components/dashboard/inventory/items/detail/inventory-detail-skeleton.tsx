import { memo } from 'react';

import { Skeleton } from '@repo/ui/components/base/skeleton';

function InventoryDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-10 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Skeleton className="h-56 rounded-md" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-md" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-md" />
    </div>
  );
}

export default memo(InventoryDetailSkeleton);
