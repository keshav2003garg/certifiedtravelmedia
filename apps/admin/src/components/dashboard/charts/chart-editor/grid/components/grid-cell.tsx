import { memo } from 'react';

import { cn } from '@repo/ui/lib/utils';

import { TileCard } from './tile-card';

import type { DragEvent, MouseEvent, PointerEvent } from 'react';
import type { ChartTile } from '@/hooks/useChartEditor/types';

interface GridCellProps {
  col: number;
  row: number;
  colSpan?: number;
  tile: ChartTile | null;
  selectedTileId: string | null;
  isLocked: boolean;
  isDragTarget: boolean;
  canDropHere: boolean;
  onSelectTile: (tile: ChartTile | null) => void;
  onTileDragStart?: (
    tile: ChartTile,
    event: PointerEvent<HTMLButtonElement>,
  ) => void;
  onTileContextMenu?: (
    tile: ChartTile,
    event: MouseEvent<HTMLButtonElement>,
  ) => void;
  onInventoryDragOver?: (
    col: number,
    row: number,
    event: DragEvent<HTMLDivElement>,
  ) => void;
  onInventoryDragLeave?: (event: DragEvent<HTMLDivElement>) => void;
  onInventoryDrop?: (
    col: number,
    row: number,
    event: DragEvent<HTMLDivElement>,
  ) => void;
}

export const GridCell = memo(function GridCell({
  col,
  row,
  colSpan = 1,
  tile,
  selectedTileId,
  isLocked,
  isDragTarget,
  canDropHere,
  onSelectTile,
  onTileDragStart,
  onTileContextMenu,
  onInventoryDragOver,
  onInventoryDragLeave,
  onInventoryDrop,
}: GridCellProps) {
  return (
    <div
      className={cn(
        'flex h-full min-w-0 items-center justify-center rounded-md border transition-colors',
        tile ? 'border-transparent' : 'border-gray-200 bg-white',
        !tile && !isLocked && 'hover:border-gray-300 hover:bg-gray-50',
        isDragTarget && canDropHere && 'ring-2 ring-blue-400 ring-offset-1',
        isDragTarget && !canDropHere && 'ring-2 ring-red-300 ring-offset-1',
      )}
      style={colSpan > 1 ? { gridColumn: `span ${colSpan}` } : undefined}
      data-chart-cell="true"
      data-col={col}
      data-row={row}
      onDragOver={(event) => onInventoryDragOver?.(col, row, event)}
      onDragLeave={onInventoryDragLeave}
      onDrop={(event) => onInventoryDrop?.(col, row, event)}
    >
      {tile ? (
        <TileCard
          tile={tile}
          isSelected={selectedTileId === tile.id}
          isLocked={isLocked}
          onClick={() => onSelectTile(tile)}
          onPointerDown={(event) => onTileDragStart?.(tile, event)}
          onContextMenu={(event) => onTileContextMenu?.(tile, event)}
        />
      ) : (
        <button
          type="button"
          className="flex h-full w-full items-center justify-center"
          onClick={() => onSelectTile(null)}
          tabIndex={-1}
        >
          <span className="text-muted-foreground text-[9px]">
            {col},{row}
          </span>
        </button>
      )}
    </div>
  );
});
