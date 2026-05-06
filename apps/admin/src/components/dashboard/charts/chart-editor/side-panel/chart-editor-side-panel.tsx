import { memo } from 'react';

import { Card, CardContent } from '@repo/ui/components/base/card';
import { cn } from '@repo/ui/lib/utils';

import { AvailableInventorySidebar } from './components/available-inventory-sidebar';
import { PaidTilesSidebar } from './components/paid-tiles-sidebar';
import { TileInspector } from './components/tile-inspector';

import type {
  ChartInventoryItem,
  ChartLayout,
  ChartTile,
} from '@/hooks/useChartEditor/types';

interface ChartEditorSidePanelProps {
  chart: ChartLayout;
  tiles: ChartTile[];
  selectedTile: ChartTile | null;
  selectedTileId: string | null;
  isReadOnly: boolean;
  isFullscreen: boolean;
  hasEmptyCells: boolean;
  generalNotes: string;
  paidTiles: ChartTile[];
  canPlaceInventoryItem: (item: ChartInventoryItem) => boolean;
  canPlacePaidTile: (tile: ChartTile) => boolean;
  onGeneralNotesChange: (value: string) => void;
  onAddInventoryItem: (item: ChartInventoryItem) => void;
  onAddPaidTile: (tile: ChartTile) => void;
  onInventoryItemDragStart: (item: ChartInventoryItem) => void;
  onInventoryItemDragEnd: () => void;
  onPaidTileDragStart: (tile: ChartTile) => void;
  onPaidTileDragEnd: () => void;
  onSelectTileId: (tileId: string | null) => void;
  onFlag: (tileId: string, flagNote: string) => void;
  onUnflag: (tileId: string) => void;
  onRemove: (tileId: string) => void;
  onCopy: (tileId: string) => void;
}

export const ChartEditorSidePanel = memo(function ChartEditorSidePanel({
  chart,
  tiles,
  selectedTile,
  selectedTileId,
  isReadOnly,
  isFullscreen,
  hasEmptyCells,
  generalNotes,
  paidTiles,
  canPlaceInventoryItem,
  canPlacePaidTile,
  onGeneralNotesChange,
  onAddInventoryItem,
  onAddPaidTile,
  onInventoryItemDragStart,
  onInventoryItemDragEnd,
  onPaidTileDragStart,
  onPaidTileDragEnd,
  onSelectTileId,
  onFlag,
  onUnflag,
  onRemove,
  onCopy,
}: ChartEditorSidePanelProps) {
  return (
    <div
      className={cn(
        isFullscreen
          ? 'flex min-h-0 flex-col gap-2 overflow-hidden'
          : 'space-y-3',
      )}
    >
      {selectedTile ? (
        <TileInspector
          tile={selectedTile}
          isLocked={isReadOnly}
          isCompact={isFullscreen}
          hasEmptyCells={hasEmptyCells}
          onFlag={onFlag}
          onUnflag={onUnflag}
          onRemove={onRemove}
          onCopy={onCopy}
          onClose={() => onSelectTileId(null)}
        />
      ) : null}

      {!isReadOnly ? (
        <div className="shrink-0 space-y-1.5">
          <label className="text-sm font-medium" htmlFor="chart-notes">
            Notes
          </label>
          <textarea
            id="chart-notes"
            value={generalNotes}
            onChange={(event) => onGeneralNotesChange(event.target.value)}
            rows={isFullscreen ? 2 : 3}
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="General notes for this chart"
          />
        </div>
      ) : chart.generalNotes ? (
        <Card>
          <CardContent className="p-3">
            <p className="text-muted-foreground text-xs font-medium">Notes</p>
            <p className="mt-1 text-sm">{chart.generalNotes}</p>
          </CardContent>
        </Card>
      ) : null}

      <PaidTilesSidebar
        tiles={paidTiles}
        placedTiles={tiles}
        isLocked={isReadOnly}
        isCompact={isFullscreen}
        hasEmptyCells={hasEmptyCells}
        selectedTileId={selectedTileId}
        canPlaceTile={canPlacePaidTile}
        onAddTile={onAddPaidTile}
        onTileDragStart={onPaidTileDragStart}
        onTileDragEnd={onPaidTileDragEnd}
        onSelectTile={(tile) => onSelectTileId(tile.id)}
      />

      <AvailableInventorySidebar
        items={chart.availableInventory}
        isLocked={isReadOnly}
        isCompact={isFullscreen}
        hasEmptyCells={hasEmptyCells}
        canPlaceItem={canPlaceInventoryItem}
        onAddInventoryItem={onAddInventoryItem}
        onInventoryItemDragStart={onInventoryItemDragStart}
        onInventoryItemDragEnd={onInventoryItemDragEnd}
      />
    </div>
  );
});
