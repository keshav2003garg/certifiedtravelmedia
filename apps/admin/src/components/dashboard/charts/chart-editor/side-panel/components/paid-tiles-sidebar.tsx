import { memo, useMemo } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/base/card';
import { CheckCircle } from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';

import type { ChartTile } from '@/hooks/useChartEditor/types';

interface PaidTilesSidebarProps {
  tiles: ChartTile[];
  isCompact?: boolean;
  selectedTileId: string | null;
  onSelectTile: (tile: ChartTile) => void;
}

export const PaidTilesSidebar = memo(function PaidTilesSidebar({
  tiles,
  isCompact = false,
  selectedTileId,
  onSelectTile,
}: PaidTilesSidebarProps) {
  const paidTiles = useMemo(
    () => tiles.filter((t) => t.tileType === 'Paid'),
    [tiles],
  );

  const placedCount = paidTiles.length;

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
            {placedCount} placed
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
              paidTiles.map((tile) => (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => onSelectTile(tile)}
                  className={`flex w-full items-center gap-2 rounded-md border p-2 text-left transition-colors ${
                    selectedTileId === tile.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">
                      {tile.label ?? 'Paid Tile'}
                    </p>
                    <p className="text-muted-foreground text-[10px]">
                      Position: ({tile.col}, {tile.row})
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
