import { memo, useMemo } from 'react';

import { Badge } from '@repo/ui/components/base/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/base/card';
import { CheckCircle } from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';

import type { DragEvent } from 'react';
import type { ChartTile } from '@/hooks/useChartEditor/types';

export const CHART_PAID_TILE_DRAG_MIME_TYPE =
  'application/x-chart-paid-tile-key';

interface PaidTilesSidebarProps {
  tiles: ChartTile[];
  placedTiles: ChartTile[];
  isLocked: boolean;
  isCompact?: boolean;
  hasEmptyCells: boolean;
  selectedTileId: string | null;
  canPlaceTile: (tile: ChartTile) => boolean;
  onAddTile: (tile: ChartTile) => void;
  onTileDragStart: (tile: ChartTile) => void;
  onTileDragEnd: () => void;
  onSelectTile: (tile: ChartTile) => void;
}

function getPaidTileKey(tile: ChartTile) {
  return (
    tile.contractId ??
    tile.acumaticaContractId ??
    `${tile.label ?? 'paid'}:${tile.colSpan}`
  );
}

function createPaidTileDragPreview(tile: ChartTile) {
  const preview = document.createElement('div');
  Object.assign(preview.style, {
    position: 'fixed',
    top: '-1000px',
    left: '-1000px',
    zIndex: '9999',
    width: '240px',
    padding: '9px',
    border: '1px solid #bfdbfe',
    borderRadius: '8px',
    background: '#ffffff',
    boxShadow: '0 12px 28px rgba(15, 23, 42, 0.18)',
    color: '#0f172a',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  });

  const name = document.createElement('div');
  name.textContent = tile.label ?? 'Paid Contract';
  Object.assign(name.style, {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '12px',
    fontWeight: '700',
    lineHeight: '16px',
  });

  const meta = document.createElement('div');
  meta.textContent = tile.acumaticaContractId
    ? `Contract ${tile.acumaticaContractId}`
    : 'Paid contract';
  Object.assign(meta.style, {
    marginTop: '3px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: '#64748b',
    fontSize: '10px',
    lineHeight: '14px',
  });

  preview.append(name, meta);
  document.body.appendChild(preview);

  return preview;
}

export const PaidTilesSidebar = memo(function PaidTilesSidebar({
  tiles,
  placedTiles,
  isLocked,
  isCompact = false,
  hasEmptyCells,
  selectedTileId,
  canPlaceTile,
  onAddTile,
  onTileDragStart,
  onTileDragEnd,
  onSelectTile,
}: PaidTilesSidebarProps) {
  const placedPaidTilesByKey = useMemo(() => {
    const map = new Map<string, ChartTile>();

    for (const tile of placedTiles) {
      if (tile.tileType === 'Paid') map.set(getPaidTileKey(tile), tile);
    }

    return map;
  }, [placedTiles]);

  const paidTiles = useMemo(() => {
    const map = new Map<string, ChartTile>();

    for (const tile of tiles) {
      if (tile.tileType === 'Paid') map.set(getPaidTileKey(tile), tile);
    }

    return Array.from(map.values());
  }, [tiles]);

  const placedCount = paidTiles.filter((tile) =>
    placedPaidTilesByKey.has(getPaidTileKey(tile)),
  ).length;

  function handleDragStart(
    tile: ChartTile,
    event: DragEvent<HTMLButtonElement>,
  ) {
    const key = getPaidTileKey(tile);
    const placedTile = placedPaidTilesByKey.get(key);
    const dragTile = placedTile ?? tile;

    event.dataTransfer.effectAllowed = placedTile ? 'move' : 'copyMove';
    event.dataTransfer.setData(CHART_PAID_TILE_DRAG_MIME_TYPE, key);
    event.dataTransfer.setData('text/plain', tile.label ?? 'Paid Contract');
    const dragPreview = createPaidTileDragPreview(dragTile);
    event.dataTransfer.setDragImage(dragPreview, 24, 24);
    window.setTimeout(() => dragPreview.remove(), 0);
    onTileDragStart(dragTile);
  }

  return (
    <Card
      className={cn(
        isCompact && 'flex min-h-0 flex-1 flex-col overflow-hidden',
      )}
    >
      <CardHeader className={cn(isCompact ? 'px-3 py-2' : 'pb-3')}>
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Paid Contracts</span>
          <span className="text-muted-foreground font-normal">
            {placedCount}/{paidTiles.length} placed
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('p-0', isCompact && 'min-h-0 flex-1')}>
        <div
          className={cn(
            'overflow-y-auto',
            isCompact ? 'h-full px-3 pb-3' : 'h-70 px-4 pb-4',
          )}
        >
          <div className={cn(isCompact ? 'space-y-1.5' : 'space-y-2')}>
            {paidTiles.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-xs">
                No paid tiles
              </p>
            ) : (
              paidTiles.map((tile) => {
                const key = getPaidTileKey(tile);
                const placedTile = placedPaidTilesByKey.get(key) ?? null;
                const activeTile = placedTile ?? tile;
                const isPlaced = Boolean(placedTile);
                const isDisabled =
                  isLocked || (!isPlaced && !canPlaceTile(tile));
                const disabledReason = isLocked
                  ? 'Locked'
                  : !isPlaced && !hasEmptyCells
                    ? 'Full'
                    : !isPlaced && isDisabled
                      ? 'No slot'
                      : null;

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isDisabled}
                    draggable={!isDisabled}
                    onDragStart={(event) => handleDragStart(tile, event)}
                    onDragEnd={onTileDragEnd}
                    onClick={() =>
                      isPlaced ? onSelectTile(activeTile) : onAddTile(tile)
                    }
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md border p-2 text-left transition-colors',
                      selectedTileId === activeTile.id
                        ? 'border-primary bg-primary/5'
                        : isDisabled
                          ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-70'
                          : 'cursor-grab border-gray-100 hover:border-blue-200 hover:bg-blue-50/60 active:cursor-grabbing',
                    )}
                  >
                    <CheckCircle
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isPlaced ? 'text-green-500' : 'text-blue-500',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">
                        {tile.label ?? 'Paid Tile'}
                      </p>
                      <p className="text-muted-foreground text-[10px]">
                        {isPlaced
                          ? `Position: (${activeTile.col}, ${activeTile.row})`
                          : 'Drag to place'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {disabledReason ?? (isPlaced ? 'Placed' : 'Available')}
                    </Badge>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
