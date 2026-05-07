import { memo, useCallback, useState } from 'react';

import { Badge } from '@repo/ui/components/base/badge';
import { Button } from '@repo/ui/components/base/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/base/card';
import { Copy, Flag, Trash2, X } from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';

import type { ChartTile } from '@/hooks/useChartEditor/types';

interface TileInspectorProps {
  tile: ChartTile;
  isLocked: boolean;
  isCompact?: boolean;
  hasEmptyCells: boolean;
  onFlag: (tileId: string, flagNote: string) => void;
  onUnflag: (tileId: string) => void;
  onRemove: (tileId: string) => void;
  onCopy: (tileId: string) => void;
  onClose: () => void;
}

export const TileInspector = memo(function TileInspector({
  tile,
  isLocked,
  isCompact = false,
  hasEmptyCells,
  onFlag,
  onUnflag,
  onRemove,
  onCopy,
  onClose,
}: TileInspectorProps) {
  const [flagNote, setFlagNote] = useState(tile.flagNote ?? '');
  const [showFlagInput, setShowFlagInput] = useState(false);

  const handleFlag = useCallback(() => {
    onFlag(tile.id, flagNote);
    setShowFlagInput(false);
  }, [tile.id, flagNote, onFlag]);

  const isPaid = tile.tileType === 'Paid';
  const isInventory = Boolean(tile.inventoryItemId);
  const isCustomFiller = Boolean(tile.customFillerId);

  return (
    <Card className="shrink-0">
      <CardHeader className={cn(isCompact ? 'px-3 py-2' : 'pb-3')}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Tile Details</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
            aria-label="Close tile details"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent
        className={cn(isCompact ? 'space-y-2 px-3 pb-3' : 'space-y-3')}
      >
        <div className="flex items-center gap-2">
          {tile.coverPhotoUrl && (
            <img
              src={tile.coverPhotoUrl}
              alt={tile.label ?? ''}
              loading="lazy"
              className={cn(
                'bg-muted rounded border object-contain',
                isCompact ? 'h-9 w-9' : 'h-12 w-12',
              )}
            />
          )}
          <div>
            <p className="text-sm font-medium">
              {tile.label ?? (isPaid ? 'Paid Tile' : 'Filler Tile')}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  isPaid
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }
              >
                {tile.tileType}
              </Badge>
              <span className="text-muted-foreground text-xs">
                ({tile.col}, {tile.row})
              </span>
            </div>
          </div>
        </div>

        {tile.isFlagged && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2">
            <div className="flex items-center gap-1.5">
              <Flag className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs font-medium text-red-700">Flagged</span>
            </div>
            {tile.flagNote && (
              <p className="mt-1 text-xs text-red-600">{tile.flagNote}</p>
            )}
          </div>
        )}

        {isInventory ? (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md border bg-gray-50 p-2">
              <p className="text-muted-foreground">Warehouse</p>
              <p className="mt-0.5 truncate font-medium">
                {tile.warehouseName ?? 'Unknown'}
              </p>
            </div>
            <div className="rounded-md border bg-gray-50 p-2">
              <p className="text-muted-foreground">Stock</p>
              <p className="mt-0.5 truncate font-medium">
                {tile.stockLevel ?? 'Unknown'}
              </p>
            </div>
            <div className="rounded-md border bg-gray-50 p-2">
              <p className="text-muted-foreground">Boxes</p>
              <p className="mt-0.5 font-medium">{tile.boxes ?? '-'}</p>
            </div>
            <div className="rounded-md border bg-gray-50 p-2">
              <p className="text-muted-foreground">Units/box</p>
              <p className="mt-0.5 font-medium">{tile.unitsPerBox ?? '-'}</p>
            </div>
          </div>
        ) : null}

        {isCustomFiller ? (
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="rounded-md border bg-gray-50 p-2">
              <p className="text-muted-foreground">Customer</p>
              <p className="mt-0.5 truncate font-medium">
                {tile.customerName ?? 'Unknown'}
              </p>
            </div>
          </div>
        ) : null}

        {!isLocked && (
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!hasEmptyCells}
              onClick={() => onCopy(tile.id)}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy Tile
            </Button>

            {!tile.isFlagged && !showFlagInput && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setShowFlagInput(true)}
              >
                <Flag className="h-3.5 w-3.5" />
                Flag Tile
              </Button>
            )}

            {showFlagInput && (
              <div className="space-y-2">
                <textarea
                  placeholder="Add a flag note..."
                  value={flagNote}
                  onChange={(e) => setFlagNote(e.target.value)}
                  rows={2}
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleFlag}>
                    Save Flag
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFlagInput(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {tile.isFlagged && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => onUnflag(tile.id)}
              >
                <Flag className="h-3.5 w-3.5" />
                Unflag
              </Button>
            )}

            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={() => onRemove(tile.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Tile
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
