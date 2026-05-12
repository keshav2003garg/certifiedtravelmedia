import { memo } from 'react';

import { Badge } from '@repo/ui/components/base/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/base/card';
import { PackagePlus } from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';

import type { DragEvent } from 'react';
import type { ChartInventoryItem } from '@/hooks/useChartEditor/types';

export const CHART_INVENTORY_DRAG_MIME_TYPE =
  'application/x-chart-inventory-item-id';

interface AvailableInventorySidebarProps {
  items: ChartInventoryItem[];
  isLocked: boolean;
  isCompact?: boolean;
  hasEmptyCells: boolean;
  canPlaceItem: (item: ChartInventoryItem) => boolean;
  onAddInventoryItem: (item: ChartInventoryItem) => void;
  onInventoryItemDragStart: (item: ChartInventoryItem) => void;
  onInventoryItemDragEnd: () => void;
}

function getDisabledReason(
  item: ChartInventoryItem,
  props: Pick<
    AvailableInventorySidebarProps,
    'isLocked' | 'hasEmptyCells' | 'canPlaceItem'
  >,
) {
  if (props.isLocked) return 'Locked';
  if (!props.hasEmptyCells) return 'Full';
  if (!props.canPlaceItem(item)) return 'No slot';

  return null;
}

function createInventoryDragPreview(item: ChartInventoryItem) {
  const preview = document.createElement('div');
  Object.assign(preview.style, {
    position: 'fixed',
    top: '-1000px',
    left: '-1000px',
    zIndex: '9999',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '240px',
    padding: '8px',
    border: '1px solid #bfdbfe',
    borderRadius: '8px',
    background: '#ffffff',
    boxShadow: '0 12px 28px rgba(15, 23, 42, 0.18)',
    color: '#0f172a',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  });

  if (item.coverPhotoUrl) {
    const image = document.createElement('img');
    image.src = item.coverPhotoUrl;
    image.alt = '';
    Object.assign(image.style, {
      width: '44px',
      height: '44px',
      flexShrink: '0',
      borderRadius: '6px',
      objectFit: 'cover',
      background: '#eff6ff',
    });
    preview.appendChild(image);
  } else {
    const fallback = document.createElement('div');
    Object.assign(fallback.style, {
      display: 'flex',
      width: '44px',
      height: '44px',
      flexShrink: '0',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '6px',
      background: '#eff6ff',
      color: '#2563eb',
      fontSize: '10px',
      fontWeight: '700',
    });
    fallback.textContent = 'IMG';
    preview.appendChild(fallback);
  }

  const content = document.createElement('div');
  Object.assign(content.style, {
    minWidth: '0',
    flex: '1',
  });

  const name = document.createElement('div');
  name.textContent = item.brochureName;
  Object.assign(name.style, {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '12px',
    fontWeight: '700',
    lineHeight: '16px',
  });

  const meta = document.createElement('div');
  meta.textContent = `${item.brochureTypeName} · ${item.boxes} boxes`;
  Object.assign(meta.style, {
    marginTop: '3px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: '#64748b',
    fontSize: '10px',
    lineHeight: '14px',
  });

  content.append(name, meta);
  preview.appendChild(content);
  document.body.appendChild(preview);

  return preview;
}

export const AvailableInventorySidebar = memo(
  function AvailableInventorySidebar({
    items,
    isLocked,
    isCompact = false,
    hasEmptyCells,
    canPlaceItem,
    onAddInventoryItem,
    onInventoryItemDragStart,
    onInventoryItemDragEnd,
  }: AvailableInventorySidebarProps) {
    function handleDragStart(
      item: ChartInventoryItem,
      event: DragEvent<HTMLButtonElement>,
    ) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData(CHART_INVENTORY_DRAG_MIME_TYPE, item.id);
      event.dataTransfer.setData('text/plain', item.brochureName);
      const dragPreview = createInventoryDragPreview(item);
      event.dataTransfer.setDragImage(dragPreview, 24, 24);
      window.setTimeout(() => dragPreview.remove(), 0);
      onInventoryItemDragStart(item);
    }

    return (
      <Card
        className={cn(
          isCompact && 'flex min-h-0 flex-1 basis-0 flex-col overflow-hidden',
        )}
      >
        <CardHeader className={cn(isCompact ? 'px-3 py-2' : 'pb-3')}>
          <CardTitle className="flex items-center justify-between text-sm">
            <span>Fillers</span>
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
                    canPlaceItem,
                  });
                  const isDisabled = Boolean(disabledReason);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isDisabled}
                      draggable={!isDisabled}
                      onDragStart={(event) => handleDragStart(item, event)}
                      onDragEnd={onInventoryItemDragEnd}
                      onClick={() => onAddInventoryItem(item)}
                      className={cn(
                        'group flex w-full items-start gap-2 rounded-md border p-2 text-left transition-colors',
                        isDisabled
                          ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-70'
                          : 'cursor-grab border-gray-100 hover:border-blue-200 hover:bg-blue-50/60 active:cursor-grabbing',
                      )}
                    >
                      {item.coverPhotoUrl ? (
                        <img
                          src={item.coverPhotoUrl}
                          alt={item.brochureName}
                          loading="lazy"
                          className="bg-muted h-10 w-10 shrink-0 rounded border object-contain"
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

                        <span className="mt-1 flex flex-wrap items-center gap-1">
                          <span className="text-muted-foreground inline-flex items-center gap-1 text-[10px]">
                            {item.brochureTypeName} ·
                          </span>
                          <span className="text-muted-foreground inline-flex items-center gap-1 text-[10px]">
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
