import { memo } from 'react';

import { Card, CardContent } from '@repo/ui/components/base/card';
import { Skeleton } from '@repo/ui/components/base/skeleton';
import { Grid2X2, MapPin } from '@repo/ui/lib/icons';

import type { Stats } from '@/hooks/useLocations/types';

interface LocationsStatsProps {
  stats?: Stats;
  isLoading: boolean;
}

function LocationsStats({ stats, isLoading }: LocationsStatsProps) {
  const items = [
    {
      label: 'Total Locations',
      value: stats?.totalLocations ?? 0,
      icon: MapPin,
      className: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'Total Sectors',
      value: stats?.totalSectors ?? 0,
      icon: Grid2X2,
      className: 'bg-amber-50 text-amber-700',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
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
                    {item.value.toLocaleString()}
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

export default memo(LocationsStats);
