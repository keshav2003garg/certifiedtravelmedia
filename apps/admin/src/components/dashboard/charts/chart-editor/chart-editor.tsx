import { useCallback, useMemo, useState } from 'react';

import { cn } from '@repo/ui/lib/utils';

import { InteractiveGrid } from './grid/interactive-grid';
import {
  canPlaceTileWithDisplacement,
  findFirstDisplacingSlot,
  findFirstOpenSlot,
  type GridSlot,
  placeTileWithDisplacement,
} from './grid/utils/grid-placement';
import { ChartEditorHeader } from './header/chart-editor-header';
import { ChartEditorSidePanel } from './side-panel/chart-editor-side-panel';

import type {
  ChartCustomFiller,
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
  isPrinting: boolean;
  onSave: (tiles: ChartTile[], generalNotes: string | null) => void;
  onComplete: () => void;
  onClone: () => void;
  onInitialize: () => void;
  onPrint: () => void;
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

function createTempTileId(prefix: string) {
  return `temp-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getPaidTileKey(tile: ChartTile) {
  return (
    tile.contractId ??
    tile.acumaticaContractId ??
    `${tile.label ?? 'paid'}:${tile.colSpan}`
  );
}

function createInventoryTile(
  item: ChartInventoryItem,
  slot: GridSlot,
): ChartTile {
  return {
    id: createTempTileId('inventory'),
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
    customFillerId: null,
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

function createCustomFillerTile(
  filler: ChartCustomFiller,
  slot: GridSlot,
): ChartTile {
  return {
    id: createTempTileId('custom-filler'),
    col: slot.col,
    row: slot.row,
    colSpan: 1,
    tileType: 'Filler',
    warehouseId: null,
    warehouseName: null,
    warehouseAcumaticaId: null,
    brochureTypeId: null,
    brochureTypeName: null,
    brochureId: null,
    brochureName: null,
    inventoryItemId: null,
    customFillerId: filler.id,
    contractId: null,
    label: filler.name,
    coverPhotoUrl: null,
    unitsPerBox: null,
    boxes: null,
    stockLevel: null,
    isNew: false,
    isFlagged: false,
    flagNote: null,
    tier: null,
    contractEndDate: null,
    customerName: null,
    acumaticaContractId: null,
  };
}

function createPaidTile(tile: ChartTile, slot: GridSlot): ChartTile {
  return {
    ...tile,
    id: createTempTileId('paid'),
    col: slot.col,
    row: slot.row,
    colSpan: slot.colSpan,
    tileType: 'Paid',
    warehouseId: null,
    warehouseName: null,
    warehouseAcumaticaId: null,
    brochureTypeId: null,
    brochureTypeName: null,
    brochureId: null,
    brochureName: null,
    inventoryItemId: null,
    customFillerId: null,
    boxes: null,
    stockLevel: null,
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
  isPrinting,
  onSave,
  onComplete,
  onClone,
  onInitialize,
  onPrint,
  onMonthChange,
}: ChartEditorProps) {
  const [tiles, setTiles] = useState<ChartTile[]>(chart.tiles);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [draggedInventoryItemId, setDraggedInventoryItemId] = useState<
    string | null
  >(null);
  const [draggedCustomFillerId, setDraggedCustomFillerId] = useState<
    string | null
  >(null);
  const [draggedPaidTileKey, setDraggedPaidTileKey] = useState<string | null>(
    null,
  );

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

  const draggedInventoryItem = useMemo(
    () =>
      chart.availableInventory.find(
        (item) => item.id === draggedInventoryItemId,
      ) ?? null,
    [chart.availableInventory, draggedInventoryItemId],
  );

  const draggedCustomFiller = useMemo(
    () =>
      chart.customFillers.find(
        (filler) => filler.id === draggedCustomFillerId,
      ) ?? null,
    [chart.customFillers, draggedCustomFillerId],
  );

  const placedPaidTilesByKey = useMemo(() => {
    const map = new Map<string, ChartTile>();

    for (const tile of tiles) {
      if (tile.tileType === 'Paid') map.set(getPaidTileKey(tile), tile);
    }

    return map;
  }, [tiles]);

  const paidTileCatalog = useMemo(() => {
    const map = new Map<string, ChartTile>();

    for (const tile of chart.paidTiles) {
      if (tile.tileType === 'Paid') map.set(getPaidTileKey(tile), tile);
    }

    for (const tile of tiles) {
      if (tile.tileType === 'Paid') map.set(getPaidTileKey(tile), tile);
    }

    return Array.from(map.values()).sort(
      (a, b) =>
        a.row - b.row ||
        a.col - b.col ||
        (a.label ?? '').localeCompare(b.label ?? ''),
    );
  }, [chart.paidTiles, tiles]);

  const draggedPaidTile = useMemo(() => {
    if (!draggedPaidTileKey) return null;

    return (
      placedPaidTilesByKey.get(draggedPaidTileKey) ??
      paidTileCatalog.find(
        (tile) => getPaidTileKey(tile) === draggedPaidTileKey,
      ) ??
      null
    );
  }, [draggedPaidTileKey, paidTileCatalog, placedPaidTilesByKey]);

  const handleSelectTile = useCallback((tile: ChartTile | null) => {
    setSelectedTileId(tile?.id ?? null);
  }, []);

  const canPlaceInventoryItem = useCallback(
    (item: ChartInventoryItem) =>
      Boolean(
        findFirstDisplacingSlot(
          tiles,
          chart.gridSize.width,
          chart.gridSize.height,
          createInventoryTile(item, { col: 0, row: 0, colSpan: item.colSpan }),
        ),
      ),
    [chart.gridSize, tiles],
  );

  const canPlaceInventoryItemAt = useCallback(
    (item: ChartInventoryItem, col: number, row: number) =>
      canPlaceTileWithDisplacement(
        tiles,
        chart.gridSize.width,
        chart.gridSize.height,
        createInventoryTile(item, { col, row, colSpan: item.colSpan }),
        col,
        row,
      ),
    [chart.gridSize, tiles],
  );

  const canPlaceCustomFiller = useCallback(
    (filler: ChartCustomFiller) =>
      Boolean(
        findFirstDisplacingSlot(
          tiles,
          chart.gridSize.width,
          chart.gridSize.height,
          createCustomFillerTile(filler, { col: 0, row: 0, colSpan: 1 }),
        ),
      ),
    [chart.gridSize, tiles],
  );

  const canPlaceCustomFillerAt = useCallback(
    (filler: ChartCustomFiller, col: number, row: number) =>
      canPlaceTileWithDisplacement(
        tiles,
        chart.gridSize.width,
        chart.gridSize.height,
        createCustomFillerTile(filler, { col, row, colSpan: 1 }),
        col,
        row,
      ),
    [chart.gridSize, tiles],
  );

  const canPlacePaidTile = useCallback(
    (tile: ChartTile) => {
      const placedTile = placedPaidTilesByKey.get(getPaidTileKey(tile));
      if (placedTile) return true;

      return Boolean(
        findFirstDisplacingSlot(
          tiles,
          chart.gridSize.width,
          chart.gridSize.height,
          createPaidTile(tile, { col: 0, row: 0, colSpan: tile.colSpan }),
        ),
      );
    },
    [chart.gridSize, placedPaidTilesByKey, tiles],
  );

  const canPlacePaidTileAt = useCallback(
    (tile: ChartTile, col: number, row: number) => {
      const placedTile = placedPaidTilesByKey.get(getPaidTileKey(tile));
      const tileToPlace =
        placedTile ?? createPaidTile(tile, { col, row, colSpan: tile.colSpan });

      return canPlaceTileWithDisplacement(
        tiles,
        chart.gridSize.width,
        chart.gridSize.height,
        tileToPlace,
        col,
        row,
      );
    },
    [chart.gridSize, placedPaidTilesByKey, tiles],
  );

  const handleAddInventoryItem = useCallback(
    (item: ChartInventoryItem) => {
      if (isReadOnly) return;

      setTiles((prev) => {
        const tile = createInventoryTile(item, {
          col: 0,
          row: 0,
          colSpan: item.colSpan,
        });
        const slot = findFirstDisplacingSlot(
          prev,
          chart.gridSize.width,
          chart.gridSize.height,
          tile,
        );
        if (!slot) return prev;

        const placedTile = { ...tile, col: slot.col, row: slot.row };
        const next = placeTileWithDisplacement(
          prev,
          chart.gridSize.width,
          chart.gridSize.height,
          placedTile,
          slot.col,
          slot.row,
        );
        if (!next) return prev;

        setSelectedTileId(placedTile.id);

        return next;
      });
    },
    [chart.gridSize, isReadOnly],
  );

  const handleAddCustomFiller = useCallback(
    (filler: ChartCustomFiller) => {
      if (isReadOnly) return;

      setTiles((prev) => {
        const tile = createCustomFillerTile(filler, {
          col: 0,
          row: 0,
          colSpan: 1,
        });
        const slot = findFirstDisplacingSlot(
          prev,
          chart.gridSize.width,
          chart.gridSize.height,
          tile,
        );
        if (!slot) return prev;

        const placedTile = { ...tile, col: slot.col, row: slot.row };
        const next = placeTileWithDisplacement(
          prev,
          chart.gridSize.width,
          chart.gridSize.height,
          placedTile,
          slot.col,
          slot.row,
        );
        if (!next) return prev;

        setSelectedTileId(placedTile.id);

        return next;
      });
    },
    [chart.gridSize, isReadOnly],
  );

  const handleAddPaidTile = useCallback(
    (tile: ChartTile) => {
      if (isReadOnly) return;

      const placedTile = placedPaidTilesByKey.get(getPaidTileKey(tile));
      if (placedTile) {
        setSelectedTileId(placedTile.id);
        return;
      }

      setTiles((prev) => {
        const tileToPlace = createPaidTile(tile, {
          col: 0,
          row: 0,
          colSpan: tile.colSpan,
        });
        const slot = findFirstDisplacingSlot(
          prev,
          chart.gridSize.width,
          chart.gridSize.height,
          tileToPlace,
        );
        if (!slot) return prev;

        const next = placeTileWithDisplacement(
          prev,
          chart.gridSize.width,
          chart.gridSize.height,
          tileToPlace,
          slot.col,
          slot.row,
        );
        if (!next) return prev;

        setSelectedTileId(tileToPlace.id);

        return next;
      });
    },
    [chart.gridSize, isReadOnly, placedPaidTilesByKey],
  );

  const handleInventoryDragStart = useCallback(
    (item: ChartInventoryItem) => {
      if (isReadOnly || !canPlaceInventoryItem(item)) return;

      setDraggedInventoryItemId(item.id);
    },
    [canPlaceInventoryItem, isReadOnly],
  );

  const handleInventoryDragEnd = useCallback(() => {
    setDraggedInventoryItemId(null);
  }, []);

  const handleCustomFillerDragStart = useCallback(
    (filler: ChartCustomFiller) => {
      if (isReadOnly || !canPlaceCustomFiller(filler)) return;

      setDraggedCustomFillerId(filler.id);
    },
    [canPlaceCustomFiller, isReadOnly],
  );

  const handleCustomFillerDragEnd = useCallback(() => {
    setDraggedCustomFillerId(null);
  }, []);

  const handlePaidTileDragStart = useCallback(
    (tile: ChartTile) => {
      if (isReadOnly || !canPlacePaidTile(tile)) return;

      setDraggedPaidTileKey(getPaidTileKey(tile));
    },
    [canPlacePaidTile, isReadOnly],
  );

  const handlePaidTileDragEnd = useCallback(() => {
    setDraggedPaidTileKey(null);
  }, []);

  const handlePlaceInventoryItem = useCallback(
    (item: ChartInventoryItem, col: number, row: number) => {
      if (isReadOnly) return;

      setTiles((prev) => {
        const tile = createInventoryTile(item, {
          col,
          row,
          colSpan: item.colSpan,
        });
        const next = placeTileWithDisplacement(
          prev,
          chart.gridSize.width,
          chart.gridSize.height,
          tile,
          col,
          row,
        );

        if (!next) return prev;

        setSelectedTileId(tile.id);

        return next;
      });
      setDraggedInventoryItemId(null);
    },
    [chart.gridSize, isReadOnly],
  );

  const handlePlaceCustomFiller = useCallback(
    (filler: ChartCustomFiller, col: number, row: number) => {
      if (isReadOnly) return;

      setTiles((prev) => {
        const tile = createCustomFillerTile(filler, { col, row, colSpan: 1 });
        const next = placeTileWithDisplacement(
          prev,
          chart.gridSize.width,
          chart.gridSize.height,
          tile,
          col,
          row,
        );

        if (!next) return prev;

        setSelectedTileId(tile.id);

        return next;
      });
      setDraggedCustomFillerId(null);
    },
    [chart.gridSize, isReadOnly],
  );

  const handlePlacePaidTile = useCallback(
    (tile: ChartTile, col: number, row: number) => {
      if (isReadOnly) return;

      setTiles((prev) => {
        const placedTile = prev.find(
          (currentTile) =>
            currentTile.tileType === 'Paid' &&
            getPaidTileKey(currentTile) === getPaidTileKey(tile),
        );
        const tileToPlace =
          placedTile ??
          createPaidTile(tile, { col, row, colSpan: tile.colSpan });
        const next = placeTileWithDisplacement(
          prev,
          chart.gridSize.width,
          chart.gridSize.height,
          tileToPlace,
          col,
          row,
        );

        if (!next) return prev;

        setSelectedTileId(tileToPlace.id);

        return next;
      });
      setDraggedPaidTileKey(null);
    },
    [chart.gridSize, isReadOnly],
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

        const copyId = createTempTileId('copy');
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
        const tile = prev.find((item) => item.id === tileId);
        if (!tile) return prev;

        const next = placeTileWithDisplacement(
          prev,
          chart.gridSize.width,
          chart.gridSize.height,
          tile,
          col,
          row,
        );

        return next ?? prev;
      });
      setSelectedTileId(tileId);
    },
    [chart.gridSize, isReadOnly],
  );

  const unplacedPaidCount = useMemo(() => {
    let count = 0;
    for (const tile of chart.paidTiles) {
      if (!placedPaidTilesByKey.has(getPaidTileKey(tile))) count++;
    }
    return count;
  }, [chart.paidTiles, placedPaidTilesByKey]);

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
        isPrinting={isPrinting}
        unplacedPaidCount={unplacedPaidCount}
        onSave={handleSave}
        onComplete={onComplete}
        onClone={onClone}
        onInitialize={onInitialize}
        onPrint={onPrint}
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
          draggedInventoryItem={draggedInventoryItem}
          draggedCustomFiller={draggedCustomFiller}
          draggedPaidTile={draggedPaidTile}
          selectedTileId={selectedTileId}
          isLocked={isReadOnly}
          hasEmptyCells={stats.empty > 0}
          onSelectTile={handleSelectTile}
          onDeleteTile={isReadOnly ? undefined : handleRemove}
          onCloneTile={isReadOnly ? undefined : handleCopy}
          onMoveTile={isReadOnly ? undefined : handleMove}
          onCanPlaceInventoryItem={canPlaceInventoryItemAt}
          onPlaceInventoryItem={
            isReadOnly ? undefined : handlePlaceInventoryItem
          }
          onCanPlaceCustomFiller={canPlaceCustomFillerAt}
          onPlaceCustomFiller={isReadOnly ? undefined : handlePlaceCustomFiller}
          onCanPlacePaidTile={canPlacePaidTileAt}
          onPlacePaidTile={isReadOnly ? undefined : handlePlacePaidTile}
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
          paidTiles={paidTileCatalog}
          canPlaceInventoryItem={canPlaceInventoryItem}
          canPlaceCustomFiller={canPlaceCustomFiller}
          canPlacePaidTile={canPlacePaidTile}
          onGeneralNotesChange={setGeneralNotes}
          onAddInventoryItem={handleAddInventoryItem}
          onAddCustomFiller={handleAddCustomFiller}
          onAddPaidTile={handleAddPaidTile}
          onInventoryItemDragStart={handleInventoryDragStart}
          onInventoryItemDragEnd={handleInventoryDragEnd}
          onCustomFillerDragStart={handleCustomFillerDragStart}
          onCustomFillerDragEnd={handleCustomFillerDragEnd}
          onPaidTileDragStart={handlePaidTileDragStart}
          onPaidTileDragEnd={handlePaidTileDragEnd}
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
