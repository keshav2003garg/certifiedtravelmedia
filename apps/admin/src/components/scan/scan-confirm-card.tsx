import { memo } from 'react';

import { Badge } from '@repo/ui/components/base/badge';
import { Button } from '@repo/ui/components/base/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/base/card';
import { Package } from '@repo/ui/lib/icons';
import { formatDecimal } from '@repo/utils/number';

import type { ScanInventoryItem } from '@/hooks/useScan/types';

interface ScanConfirmCardProps {
  item: ScanInventoryItem;
  onConfirm: () => void;
}

export const ScanConfirmCard = memo(function ScanConfirmCard({
  item,
  onConfirm,
}: ScanConfirmCardProps) {
  return (
    <div className="bg-muted/30 flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-md overflow-hidden shadow-none">
        <div className="bg-muted flex aspect-4/3 items-center justify-center border-b">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.brochureName || 'Brochure'}
              className="size-full object-contain"
            />
          ) : (
            <Package className="text-muted-foreground size-16" />
          )}
        </div>

        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <CardTitle className="truncate text-xl tracking-normal">
                {item.brochureName || 'Unnamed brochure'}
              </CardTitle>
              <CardDescription className="truncate">
                {item.customerName ?? item.brochureTypeName}
              </CardDescription>
            </div>
            <Badge variant="outline" className="shrink-0">
              {item.brochureTypeName}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Warehouse</dt>
              <dd className="text-foreground font-medium">
                {item.warehouseName}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Current boxes</dt>
              <dd className="text-foreground font-medium">
                {formatDecimal(item.boxes, { maxDecimals: 2, minDecimals: 0 })}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Units/box</dt>
              <dd className="text-foreground font-medium">
                {formatDecimal(item.unitsPerBox, {
                  maxDecimals: 2,
                  minDecimals: 0,
                })}
              </dd>
            </div>
            {item.warehouseAcumaticaId ? (
              <div>
                <dt className="text-muted-foreground">Warehouse ID</dt>
                <dd className="text-foreground font-medium">
                  {item.warehouseAcumaticaId}
                </dd>
              </div>
            ) : null}
          </dl>

          <Button className="w-full" onClick={onConfirm}>
            Confirm &amp; Enter Count
          </Button>
        </CardContent>
      </Card>
    </div>
  );
});
