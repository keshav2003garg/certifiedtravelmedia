import { memo } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui/components/base/tooltip';
import { cn } from '@repo/ui/lib/utils';

import { TileCard } from './tile-card';

import type { DragEvent, MouseEvent, PointerEvent } from 'react';
import type { ChartRemoval, ChartTile } from '@/hooks/useChartEditor/types';

interface GridCellProps {
  col: number;
  row: number;
  colSpan?: number;
  tile: ChartTile | null;
  removal?: ChartRemoval | null;
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
  removal = null,
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
        'box-border flex h-full min-w-0 items-center justify-center rounded-md border transition-colors',
        tile
          ? 'border-transparent'
          : removal
            ? 'border-[3px] border-red-600 bg-red-50 text-red-900'
            : 'border-gray-200 bg-white',
        !tile &&
          !removal &&
          !isLocked &&
          'hover:border-gray-300 hover:bg-gray-50',
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
          removal={removal}
          isSelected={selectedTileId === tile.id}
          isLocked={isLocked}
          onClick={() => onSelectTile(tile)}
          onPointerDown={(event) => onTileDragStart?.(tile, event)}
          onContextMenu={(event) => onTileContextMenu?.(tile, event)}
        />
      ) : removal ? (
        <RemovalCell removal={removal} onClick={() => onSelectTile(null)} />
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

interface RemovalCellProps {
  removal: ChartRemoval;
  onClick: () => void;
}

function RemovalCell({ removal, onClick }: RemovalCellProps) {
  return (
    <TooltipProvider delayDuration={250}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="flex h-full w-full min-w-0 flex-col items-center justify-center rounded-md px-1 text-center"
            onClick={onClick}
            tabIndex={-1}
          >
            <span className="text-[10px] font-semibold tracking-normal uppercase">
              To remove
            </span>
            <span className="max-w-full truncate text-xs font-semibold">
              {removal.brochureName}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-64 border-red-200 bg-red-50 text-xs text-red-900"
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold">{removal.brochureName}</span>
            {removal.customerName ? (
              <span>Customer: {removal.customerName}</span>
            ) : null}
            {removal.contractId ? (
              <span>Contract: {removal.contractId}</span>
            ) : null}
            <span>Expired: {removal.expiredDate}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
