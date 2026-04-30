import { memo } from 'react';

import { Skeleton } from '@repo/ui/components/base/skeleton';

function UsersSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border">
      <div className="divide-y">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="grid gap-4 p-4 md:grid-cols-[1.3fr_1.5fr_0.8fr_0.7fr_44px] md:items-center"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-28 md:hidden" />
            </div>
            <Skeleton className="hidden h-4 w-52 md:block" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-8 w-8 justify-self-end rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(UsersSkeleton);
