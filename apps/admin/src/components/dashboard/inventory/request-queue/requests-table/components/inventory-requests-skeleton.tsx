import { memo } from 'react';

import { Skeleton } from '@repo/ui/components/base/skeleton';

function InventoryRequestsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="grid gap-4 rounded-md border p-4 md:grid-cols-[1.8fr_100px_160px_140px_120px]"
        >
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

export default memo(InventoryRequestsSkeleton);
