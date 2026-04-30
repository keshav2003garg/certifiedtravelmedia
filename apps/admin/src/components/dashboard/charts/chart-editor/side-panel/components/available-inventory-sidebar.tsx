import { memo } from 'react';

import { Badge } from '@repo/ui/components/base/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/base/card';
import { Boxes, PackagePlus, Warehouse } from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';

import type { ChartInventoryItem } from '@/hooks/useChartEditor/types';

interface AvailableInventorySidebarProps {
  items: ChartInventoryItem[];
  isLocked: boolean;
  isCompact?: boolean;
  hasEmptyCells: boolean;
  placedInventoryItemIds: Set<string>;
  canPlaceItem: (item: ChartInventoryItem) => boolean;
  onAddInventoryItem: (item: ChartInventoryItem) => void;
}

function getDisabledReason(
  item: ChartInventoryItem,
  props: Pick<
    AvailableInventorySidebarProps,
    'isLocked' | 'hasEmptyCells' | 'placedInventoryItemIds' | 'canPlaceItem'
  >,
) {
  if (props.isLocked) return 'Locked';
  if (props.placedInventoryItemIds.has(item.id)) return 'Placed';
  if (!props.hasEmptyCells) return 'Full';
  if (!props.canPlaceItem(item)) return 'No slot';

  return null;
}

export const AvailableInventorySidebar = memo(
  function AvailableInventorySidebar({
    items,
    isLocked,
    isCompact = false,
    hasEmptyCells,
    placedInventoryItemIds,
    canPlaceItem,
    onAddInventoryItem,
  }: AvailableInventorySidebarProps) {
    return (
      <Card
        className={cn(
          isCompact && 'flex min-h-0 flex-1 basis-0 flex-col overflow-hidden',
        )}
      >
        <CardHeader className={cn(isCompact ? 'px-3 py-2' : 'pb-3')}>
          <CardTitle className="flex items-center justify-between text-sm">
            <span>Warehouse Inventory</span>
            <span className="text-muted-foreground font-normal">
              {items.length} items
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className={cn('p-0', isCompact && 'min-h-0 flex-1')}>
          <div
            className={cn(
              'overflow-y-auto',
              isCompact ? 'h-full px-3 pb-3' : 'max-h-90 px-4 pb-4',
            )}
          >
            <div className={cn(isCompact ? 'space-y-1.5' : 'space-y-2')}>
              {items.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-xs">
                  No linked warehouse inventory
                </p>
              ) : (
                items.map((item) => {
                  const disabledReason = getDisabledReason(item, {
                    isLocked,
                    hasEmptyCells,
                    placedInventoryItemIds,
                    canPlaceItem,
                  });
                  const isDisabled = Boolean(disabledReason);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => onAddInventoryItem(item)}
                      className={cn(
                        'group flex w-full items-start gap-2 rounded-md border p-2 text-left transition-colors',
                        isDisabled
                          ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-70'
                          : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50/60',
                      )}
                    >
                      {item.coverPhotoUrl ? (
                        <img
                          src={item.coverPhotoUrl}
                          alt={item.brochureName}
                          loading="lazy"
                          className="h-10 w-10 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-blue-50 text-blue-600">
                          <PackagePlus className="size-4" />
                        </span>
                      )}

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold">
                          {item.brochureName}
                        </span>
                        <span className="text-muted-foreground mt-0.5 flex min-w-0 items-center gap-1 text-[10px]">
                          <Warehouse className="size-3 shrink-0" />
                          <span className="truncate">{item.warehouseName}</span>
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-1">
                          <Badge
                            variant="outline"
                            className="px-1.5 py-0 text-[10px]"
                          >
                            {item.brochureTypeName}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="px-1.5 py-0 text-[10px]"
                          >
                            {item.colSpan} cols
                          </Badge>
                          <span className="text-muted-foreground inline-flex items-center gap-1 text-[10px]">
                            <Boxes className="size-3" />
                            {item.boxes} boxes
                          </span>
                        </span>
                      </span>

                      {disabledReason ? (
                        <Badge
                          variant="secondary"
                          className="shrink-0 text-[10px]"
                        >
                          {disabledReason}
                        </Badge>
                      ) : (
                        <PackagePlus className="mt-1 size-4 shrink-0 text-blue-600 opacity-80 group-hover:opacity-100" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },
);
