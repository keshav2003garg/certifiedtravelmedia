import { memo } from 'react';

import { Skeleton } from '@repo/ui/components/base/skeleton';

function WarehousesSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="grid gap-4 rounded-md border p-4 md:grid-cols-[1fr_140px_220px_90px_110px_110px_44px]"
        >
          <div className="space-y-2">
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-5 w-24" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-9" />
        </div>
      ))}
    </div>
  );
}

export default memo(WarehousesSkeleton);
