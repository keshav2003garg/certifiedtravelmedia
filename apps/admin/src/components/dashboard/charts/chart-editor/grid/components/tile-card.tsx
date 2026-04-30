import { memo, useMemo } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui/components/base/tooltip';
import { Flag } from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';

import type { MouseEvent, PointerEvent } from 'react';
import type { ChartTile } from '@/hooks/useChartEditor/types';

interface TileCardProps {
  tile: ChartTile;
  isSelected: boolean;
  isLocked: boolean;
  onClick: () => void;
  onPointerDown?: (event: PointerEvent<HTMLButtonElement>) => void;
  onContextMenu?: (event: MouseEvent<HTMLButtonElement>) => void;
}

export const TileCard = memo(function TileCard({
  tile,
  isSelected,
  isLocked,
  onClick,
  onPointerDown,
  onContextMenu,
}: TileCardProps) {
  const isPaid = tile.tileType === 'Paid';
  const isNew = isPaid && tile.isNew;
  const isPremium = isPaid && !isNew && tile.tier === 'Premium Placement';
  const isFiller = tile.tileType === 'Filler';
  const isInventory = Boolean(tile.inventoryItemId);

  const tooltipContent = useMemo(() => {
    if (!isPaid && !isInventory) return null;

    return (
      <div className="flex flex-col gap-0.5">
        {tile.label ? (
          <span className="font-semibold">{tile.label}</span>
        ) : null}
        {tile.customerName ? <span>{tile.customerName}</span> : null}
        {tile.acumaticaContractId ? (
          <span>Contract: {tile.acumaticaContractId}</span>
        ) : null}
        {tile.contractEndDate ? (
          <span>Ends: {tile.contractEndDate}</span>
        ) : null}
        {tile.warehouseName ? (
          <span>Warehouse: {tile.warehouseName}</span>
        ) : null}
        {tile.boxes !== null ? <span>Boxes: {tile.boxes}</span> : null}
        {tile.stockLevel ? <span>Stock: {tile.stockLevel}</span> : null}
      </div>
    );
  }, [isInventory, isPaid, tile]);

  const tileButton = (
    <button
      type="button"
      onClick={onClick}
      draggable={false}
      onPointerDown={onPointerDown}
      onContextMenu={onContextMenu}
      className={cn(
        'relative flex h-full min-h-11 w-full flex-col items-center justify-center rounded-md p-1 text-center transition-colors',
        !isLocked && onPointerDown
          ? 'cursor-grab touch-none active:cursor-grabbing'
          : '',
        isNew
          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
          : isPremium
            ? 'bg-amber-500 text-white hover:bg-amber-600'
            : isPaid
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : isInventory
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
        isSelected && 'ring-primary ring-2 ring-offset-1',
      )}
    >
      <span
        className={cn(
          'max-w-full truncate text-xs leading-tight font-semibold',
          isFiller && !isInventory ? 'text-gray-700' : 'text-white',
        )}
      >
        {tile.label ?? (isPaid ? 'Paid' : 'Inventory')}
      </span>
      {tile.isFlagged ? (
        <Flag
          className={cn(
            'absolute top-0.5 right-0.5 size-3',
            isFiller && !isInventory ? 'text-red-500' : 'text-red-100',
          )}
        />
      ) : null}
    </button>
  );

  if (!tooltipContent) return tileButton;

  return (
    <TooltipProvider delayDuration={250}>
      <Tooltip>
        <TooltipTrigger asChild>{tileButton}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
