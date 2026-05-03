import { memo } from 'react';

import { Card, CardContent } from '@repo/ui/components/base/card';
import { Skeleton } from '@repo/ui/components/base/skeleton';
import { CheckCircle2, Clock, Inbox, XCircle } from '@repo/ui/lib/icons';
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
      label: 'Total Requests',
      value: stats?.total ?? 0,
      icon: Inbox,
      className: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'Pending Review',
      value: stats?.pending ?? 0,
      icon: Clock,
      className: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Approved',
      value: stats?.approved ?? 0,
      icon: CheckCircle2,
      className: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Rejected',
      value: stats?.rejected ?? 0,
      icon: XCircle,
      className: 'bg-rose-50 text-rose-700',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="shadow-none">
          <CardContent className="flex items-center gap-4 p-5">
            {isLoading ? (
              <>
                <Skeleton className="size-11 rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-7 w-16" />
                </div>
              </>
            ) : (
              <>
                <div
                  className={`flex size-11 items-center justify-center rounded-md ${item.className}`}
                >
                  <item.icon className="size-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    {item.label}
                  </p>
                  <p className="text-2xl font-semibold tracking-normal">
                    {formatCount(item.value)}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default memo(InventoryRequestsStats);
