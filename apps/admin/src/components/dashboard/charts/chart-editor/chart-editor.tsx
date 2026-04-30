import { useCallback, useMemo, useState } from 'react';

import { cn } from '@repo/ui/lib/utils';

import { InteractiveGrid } from './grid/interactive-grid';
import {
  canPlaceTileAt,
  findFirstOpenSlot,
  type GridSlot,
} from './grid/utils/grid-placement';
import { ChartEditorHeader } from './header/chart-editor-header';
import { ChartEditorSidePanel } from './side-panel/chart-editor-side-panel';

import type {
  ChartInventoryItem,
  ChartLayout,
  ChartTile,
} from '@/hooks/useChartEditor/types';

interface ChartEditorProps {
  chart: ChartLayout;
  isFullscreen?: boolean;
  isManager: boolean;
  isSaving: boolean;
  isCompleting: boolean;
  isCloning: boolean;
  isInitializing: boolean;
  onSave: (tiles: ChartTile[], generalNotes: string | null) => void;
  onComplete: () => void;
  onClone: () => void;
  onInitialize: () => void;
  onMonthChange: (month: number, year: number) => void;
}

function getChartKey(chart: ChartLayout) {
  return [
    chart.id ?? 'preview',
    chart.sectorId,
    chart.standWidth,
    chart.standHeight,
    chart.month,
    chart.year,
    chart.updatedAt ?? 'not-updated',
  ].join(':');
}

function createInventoryTile(
  item: ChartInventoryItem,
  slot: GridSlot,
): ChartTile {
  return {
    id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    col: slot.col,
    row: slot.row,
    colSpan: slot.colSpan,
    tileType: 'Filler',
    warehouseId: item.warehouseId,
    warehouseName: item.warehouseName,
    warehouseAcumaticaId: item.warehouseAcumaticaId,
    brochureTypeId: item.brochureTypeId,
    brochureTypeName: item.brochureTypeName,
    brochureId: item.brochureId,
    brochureName: item.brochureName,
    inventoryItemId: item.id,
    contractId: null,
    label: item.brochureName,
    coverPhotoUrl: item.coverPhotoUrl,
    unitsPerBox: item.unitsPerBox,
    boxes: item.boxes,
    stockLevel: item.stockLevel,
    isNew: false,
    isFlagged: false,
    flagNote: null,
    tier: null,
    contractEndDate: null,
    customerName: item.customerName,
    acumaticaContractId: null,
  };
}

export function ChartEditor(props: ChartEditorProps) {
  return <ChartEditorInner key={getChartKey(props.chart)} {...props} />;
}

function ChartEditorInner({
  chart,
  isFullscreen = false,
  isManager,
  isSaving,
  isCompleting,
  isCloning,
  isInitializing,
  onSave,
  onComplete,
  onClone,
  onInitialize,
  onMonthChange,
}: ChartEditorProps) {
  const [tiles, setTiles] = useState<ChartTile[]>(chart.tiles);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);

  const [generalNotes, setGeneralNotes] = useState(chart.generalNotes ?? '');

  const isPreview = !chart.persisted;
  const isPastMonth = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    return (
      chart.year < currentYear ||
      (chart.year === currentYear && chart.month < currentMonth)
    );
  }, [chart.month, chart.year]);
  const isReadOnly = chart.locked || isPreview || isPastMonth || !isManager;

  const selectedTile = useMemo(
    () => tiles.find((tile) => tile.id === selectedTileId) ?? null,
    [tiles, selectedTileId],
  );

  const stats = useMemo(() => {
    const paid = tiles.filter((tile) => tile.tileType === 'Paid').length;
    const inventory = tiles.filter((tile) => tile.tileType === 'Filler').length;
    const total = chart.gridSize.width * chart.gridSize.height;
    const used = tiles.reduce((sum, tile) => sum + tile.colSpan, 0);

    return { paid, inventory, empty: Math.max(total - used, 0), total };
  }, [tiles, chart.gridSize]);

  const placedInventoryItemIds = useMemo(
    () =>
      new Set(
        tiles
          .map((tile) => tile.inventoryItemId)
          .filter((id): id is string => Boolean(id)),
      ),
    [tiles],
  );

  const handleSelectTile = useCallback((tile: ChartTile | null) => {
    setSelectedTileId(tile?.id ?? null);
  }, []);

  const canPlaceInventoryItem = useCallback(
    (item: ChartInventoryItem) =>
      Boolean(
        findFirstOpenSlot(
          tiles,
          chart.gridSize.width,
          chart.gridSize.height,
          item.colSpan,
        ),
      ),
    [chart.gridSize, tiles],
  );

  const handleAddInventoryItem = useCallback(
    (item: ChartInventoryItem) => {
      if (isReadOnly || placedInventoryItemIds.has(item.id)) return;

      const slot = findFirstOpenSlot(
        tiles,
        chart.gridSize.width,
        chart.gridSize.height,
        item.colSpan,
      );
      if (!slot) return;

      const tile = createInventoryTile(item, slot);
      setTiles((prev) => [...prev, tile]);
      setSelectedTileId(tile.id);
    },
    [chart.gridSize, isReadOnly, placedInventoryItemIds, tiles],
  );

  const handleFlag = useCallback((tileId: string, flagNote: string) => {
    setTiles((prev) =>
      prev.map((tile) =>
        tile.id === tileId ? { ...tile, isFlagged: true, flagNote } : tile,
      ),
    );
  }, []);

  const handleUnflag = useCallback((tileId: string) => {
    setTiles((prev) =>
      prev.map((tile) =>
        tile.id === tileId
          ? { ...tile, isFlagged: false, flagNote: null }
          : tile,
      ),
    );
  }, []);

  const handleRemove = useCallback((tileId: string) => {
    setTiles((prev) => prev.filter((tile) => tile.id !== tileId));
    setSelectedTileId(null);
  }, []);

  const handleCopy = useCallback(
    (tileId: string) => {
      setTiles((prev) => {
        const source = prev.find((tile) => tile.id === tileId);
        if (!source) return prev;

        const slot = findFirstOpenSlot(
          prev,
          chart.gridSize.width,
          chart.gridSize.height,
          source.colSpan,
        );
        if (!slot) return prev;

        const copyId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const copy = { ...source, id: copyId, col: slot.col, row: slot.row };
        setSelectedTileId(copyId);

        return [...prev, copy];
      });
    },
    [chart.gridSize],
  );

  const handleMove = useCallback(
    (tileId: string, col: number, row: number) => {
      if (isReadOnly) return;

      setTiles((prev) => {
        if (
          !canPlaceTileAt(
            prev,
            chart.gridSize.width,
            chart.gridSize.height,
            tileId,
            col,
            row,
          )
        ) {
          return prev;
        }

        return prev.map((tile) =>
          tile.id === tileId ? { ...tile, col, row } : tile,
        );
      });
      setSelectedTileId(tileId);
    },
    [chart.gridSize, isReadOnly],
  );

  const handleSave = useCallback(() => {
    onSave(tiles, generalNotes || null);
  }, [onSave, tiles, generalNotes]);

  return (
    <div
      className={cn(
        isFullscreen
          ? 'flex h-full min-h-0 flex-col gap-2 overflow-hidden'
          : 'space-y-4',
      )}
    >
      <ChartEditorHeader
        chart={chart}
        stats={stats}
        isFullscreen={isFullscreen}
        isPreview={isPreview}
        isPastMonth={isPastMonth}
        isManager={isManager}
        isSaving={isSaving}
        isCompleting={isCompleting}
        isCloning={isCloning}
        isInitializing={isInitializing}
        onSave={handleSave}
        onComplete={onComplete}
        onClone={onClone}
        onInitialize={onInitialize}
        onMonthChange={onMonthChange}
      />

      <div
        className={cn(
          'grid gap-3 lg:grid-cols-[minmax(0,1fr)_270px]',
          isFullscreen ? 'min-h-0 flex-1 overflow-hidden' : 'min-h-160',
        )}
      >
        <InteractiveGrid
          width={chart.gridSize.width}
          height={chart.gridSize.height}
          tiles={tiles}
          selectedTileId={selectedTileId}
          isLocked={isReadOnly}
          hasEmptyCells={stats.empty > 0}
          onSelectTile={handleSelectTile}
          onDeleteTile={isReadOnly ? undefined : handleRemove}
          onCloneTile={isReadOnly ? undefined : handleCopy}
          onMoveTile={isReadOnly ? undefined : handleMove}
          onFlagTile={isReadOnly ? undefined : handleFlag}
          onUnflagTile={isReadOnly ? undefined : handleUnflag}
        />

        <ChartEditorSidePanel
          chart={chart}
          tiles={tiles}
          selectedTile={selectedTile}
          selectedTileId={selectedTileId}
          isReadOnly={isReadOnly}
          isFullscreen={isFullscreen}
          hasEmptyCells={stats.empty > 0}
          generalNotes={generalNotes}
          placedInventoryItemIds={placedInventoryItemIds}
          canPlaceInventoryItem={canPlaceInventoryItem}
          onGeneralNotesChange={setGeneralNotes}
          onAddInventoryItem={handleAddInventoryItem}
          onSelectTileId={setSelectedTileId}
          onFlag={handleFlag}
          onUnflag={handleUnflag}
          onRemove={handleRemove}
          onCopy={handleCopy}
        />
      </div>
    </div>
  );
}
