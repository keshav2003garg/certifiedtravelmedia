import { memo } from 'react';

import { Card, CardContent } from '@repo/ui/components/base/card';
import { Skeleton } from '@repo/ui/components/base/skeleton';
import { Boxes, Clock } from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';
import { formatCount } from '@repo/utils/number';

import type { InventoryRequestStats } from '@/hooks/useInventoryRequests/types';

interface InventoryRequestsStatsProps {
  stats?: InventoryRequestStats;
  isLoading: boolean;
}

function InventoryRequestsStats({
  stats,
  isLoading,
}: InventoryRequestsStatsProps) {
  const items = [
    {
      label: 'Pending Reviews',
      value: formatCount(stats?.pending ?? 0),
      icon: Clock,
      iconClassName: 'bg-amber-100 text-amber-600',
    },
    {
      label: 'Unconfirmed Items',
      value: formatCount(stats?.pendingBoxes ?? 0),
      icon: Boxes,
      iconClassName: 'bg-sky-100 text-sky-600',
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.label} className="shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              {isLoading ? (
                <>
                  <Skeleton className="size-9 rounded-md" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </>
              ) : (
                <>
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-md',
                      item.iconClassName,
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="text-muted-foreground block text-xs font-semibold">
                      {item.label}
                    </span>
                    <span className="text-foreground mt-0.5 block text-xl font-bold tracking-normal">
                      {item.value}
                    </span>
                  </span>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default memo(InventoryRequestsStats);
