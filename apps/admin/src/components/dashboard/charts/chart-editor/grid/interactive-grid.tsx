import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { GridCell } from './components/grid-cell';
import {
  FlagTileDialog,
  type FlagTileDialogState,
} from './dialogs/flag-tile-dialog';
import {
  TileContextMenu,
  type TileContextMenuAction,
  type TileContextMenuState,
} from './menus/tile-context-menu';
import { canPlaceTileWithDisplacement } from './utils/grid-placement';

import type {
  DragEvent,
  MouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import type {
  ChartInventoryItem,
  ChartTile,
} from '@/hooks/useChartEditor/types';

interface InteractiveGridProps {
  width: number;
  height: number;
  tiles: ChartTile[];
  draggedInventoryItem: ChartInventoryItem | null;
  draggedPaidTile: ChartTile | null;
  selectedTileId: string | null;
  isLocked: boolean;
  hasEmptyCells: boolean;
  onSelectTile: (tile: ChartTile | null) => void;
  onDeleteTile?: (tileId: string) => void;
  onCloneTile?: (tileId: string) => void;
  onMoveTile?: (tileId: string, col: number, row: number) => void;
  onCanPlaceInventoryItem?: (
    item: ChartInventoryItem,
    col: number,
    row: number,
  ) => boolean;
  onPlaceInventoryItem?: (
    item: ChartInventoryItem,
    col: number,
    row: number,
  ) => void;
  onCanPlacePaidTile?: (tile: ChartTile, col: number, row: number) => boolean;
  onPlacePaidTile?: (tile: ChartTile, col: number, row: number) => void;
  onFlagTile?: (tileId: string, flagNote: string) => void;
  onUnflagTile?: (tileId: string) => void;
}

interface TileDragState {
  tile: ChartTile;
  pointerId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
}

interface CellPosition {
  col: number;
  row: number;
}

const DRAG_THRESHOLD_PX = 4;

function getPointerDistance(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
) {
  return Math.hypot(currentX - startX, currentY - startY);
}

function getChartCellFromPoint(clientX: number, clientY: number) {
  const target = document.elementFromPoint(clientX, clientY);
  const cell = target?.closest<HTMLElement>('[data-chart-cell="true"]');
  if (!cell) return null;

  const col = Number(cell.dataset.col);
  const row = Number(cell.dataset.row);

  if (!Number.isInteger(col) || !Number.isInteger(row)) return null;

  return { col, row } satisfies CellPosition;
}

export const InteractiveGrid = memo(function InteractiveGrid({
  width,
  height,
  tiles,
  draggedInventoryItem,
  draggedPaidTile,
  selectedTileId,
  isLocked,
  hasEmptyCells,
  onSelectTile,
  onDeleteTile,
  onCloneTile,
  onMoveTile,
  onCanPlaceInventoryItem,
  onPlaceInventoryItem,
  onCanPlacePaidTile,
  onPlacePaidTile,
  onFlagTile,
  onUnflagTile,
}: InteractiveGridProps) {
  const [dragState, setDragState] = useState<TileDragState | null>(null);
  const [dragOverCell, setDragOverCell] = useState<CellPosition | null>(null);
  const [sidebarDragOverCell, setSidebarDragOverCell] =
    useState<CellPosition | null>(null);
  const [contextMenu, setContextMenu] = useState<TileContextMenuState | null>(
    null,
  );
  const [flagDialog, setFlagDialog] = useState<FlagTileDialogState | null>(
    null,
  );

  const { tileMap, occupiedCells } = useMemo(() => {
    const map = new Map<string, ChartTile>();
    const occupied = new Set<string>();
    for (const tile of tiles) {
      map.set(`${tile.col}-${tile.row}`, tile);
      // Mark extra cells as occupied for multi-column tiles
      for (let c = 1; c < (tile.colSpan ?? 1); c++) {
        occupied.add(`${tile.col + c}-${tile.row}`);
      }
    }
    return { tileMap: map, occupiedCells: occupied };
  }, [tiles]);

  const rows = useMemo(() => {
    const result: { row: number; cells: { col: number; row: number }[] }[] = [];
    for (let r = 0; r < height; r++) {
      const cells: { col: number; row: number }[] = [];
      for (let c = 0; c < width; c++) {
        cells.push({ col: c, row: r });
      }
      result.push({ row: r, cells });
    }
    return result;
  }, [width, height]);

  const canDropTile = useCallback(
    (tile: ChartTile, col: number, row: number) =>
      canPlaceTileWithDisplacement(tiles, width, height, tile, col, row),
    [height, tiles, width],
  );

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  useEffect(() => {
    if (!contextMenu) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeContextMenu();
    };

    window.addEventListener('click', closeContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', closeContextMenu);
    window.addEventListener('scroll', closeContextMenu, true);

    return () => {
      window.removeEventListener('click', closeContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', closeContextMenu);
      window.removeEventListener('scroll', closeContextMenu, true);
    };
  }, [closeContextMenu, contextMenu]);

  const handleTileDragStart = useCallback(
    (tile: ChartTile, event: ReactPointerEvent<HTMLButtonElement>) => {
      if (isLocked || !onMoveTile || event.button !== 0) return;

      event.currentTarget.setPointerCapture?.(event.pointerId);
      setContextMenu(null);
      setDragState({
        tile,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        currentX: event.clientX,
        currentY: event.clientY,
        isDragging: false,
      });
    },
    [isLocked, onMoveTile],
  );

  const clearDragState = useCallback(() => {
    setDragState(null);
    setDragOverCell(null);
  }, []);

  const clearInventoryDragTarget = useCallback(() => {
    setSidebarDragOverCell(null);
  }, []);

  const handleTileContextMenu = useCallback(
    (tile: ChartTile, event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onSelectTile(tile);
      clearDragState();
      setContextMenu({ tile, x: event.clientX, y: event.clientY });
    },
    [clearDragState, onSelectTile],
  );

  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== dragState.pointerId) return;

      const distance = getPointerDistance(
        dragState.startX,
        dragState.startY,
        event.clientX,
        event.clientY,
      );
      const isDragging = dragState.isDragging || distance > DRAG_THRESHOLD_PX;

      if (!isDragging) return;

      event.preventDefault();
      const cell = getChartCellFromPoint(event.clientX, event.clientY);
      setDragOverCell(cell);
      setContextMenu(null);
      setDragState((current) =>
        current
          ? {
              ...current,
              currentX: event.clientX,
              currentY: event.clientY,
              isDragging: true,
            }
          : null,
      );
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId !== dragState.pointerId) return;

      const distance = getPointerDistance(
        dragState.startX,
        dragState.startY,
        event.clientX,
        event.clientY,
      );
      const wasDragging = dragState.isDragging || distance > DRAG_THRESHOLD_PX;
      const cell = getChartCellFromPoint(event.clientX, event.clientY);

      if (
        wasDragging &&
        cell &&
        onMoveTile &&
        canDropTile(dragState.tile, cell.col, cell.row)
      ) {
        onMoveTile(dragState.tile.id, cell.col, cell.row);
      }

      clearDragState();
    };

    const handlePointerCancel = () => clearDragState();

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove, {
      passive: false,
    });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [canDropTile, clearDragState, dragState, onMoveTile]);

  useEffect(() => {
    if (!draggedInventoryItem && !draggedPaidTile) clearInventoryDragTarget();
  }, [clearInventoryDragTarget, draggedInventoryItem, draggedPaidTile]);

  const canDropSidebarItem = useCallback(
    (col: number, row: number) => {
      if (draggedInventoryItem) {
        return Boolean(
          onCanPlaceInventoryItem?.(draggedInventoryItem, col, row),
        );
      }

      if (draggedPaidTile) {
        return Boolean(onCanPlacePaidTile?.(draggedPaidTile, col, row));
      }

      return false;
    },
    [
      draggedInventoryItem,
      draggedPaidTile,
      onCanPlaceInventoryItem,
      onCanPlacePaidTile,
    ],
  );

  const handleInventoryDragOver = useCallback(
    (col: number, row: number, event: DragEvent<HTMLDivElement>) => {
      if (
        isLocked ||
        (!draggedInventoryItem && !draggedPaidTile) ||
        (!onPlaceInventoryItem && !onPlacePaidTile)
      ) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = canDropSidebarItem(col, row)
        ? draggedPaidTile
          ? 'move'
          : 'copy'
        : 'none';
      setSidebarDragOverCell((current) =>
        current?.col === col && current.row === row ? current : { col, row },
      );
    },
    [
      canDropSidebarItem,
      draggedInventoryItem,
      draggedPaidTile,
      isLocked,
      onPlaceInventoryItem,
      onPlacePaidTile,
    ],
  );

  const handleInventoryDragLeave = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      const nextTarget = event.relatedTarget;

      if (
        nextTarget instanceof Node &&
        event.currentTarget.contains(nextTarget)
      ) {
        return;
      }

      clearInventoryDragTarget();
    },
    [clearInventoryDragTarget],
  );

  const handleInventoryDrop = useCallback(
    (col: number, row: number, event: DragEvent<HTMLDivElement>) => {
      if (!draggedInventoryItem && !draggedPaidTile) return;

      event.preventDefault();

      if (canDropSidebarItem(col, row)) {
        if (draggedInventoryItem && onPlaceInventoryItem) {
          onPlaceInventoryItem(draggedInventoryItem, col, row);
        } else if (draggedPaidTile && onPlacePaidTile) {
          onPlacePaidTile(draggedPaidTile, col, row);
        }
      }

      clearInventoryDragTarget();
    },
    [
      canDropSidebarItem,
      clearInventoryDragTarget,
      draggedInventoryItem,
      draggedPaidTile,
      onPlaceInventoryItem,
      onPlacePaidTile,
    ],
  );

  const runContextAction = useCallback(
    (action: TileContextMenuAction) => {
      if (!contextMenu) return;

      const tile = contextMenu.tile;
      closeContextMenu();

      if (action === 'view') {
        onSelectTile(tile);
        return;
      }

      if (isLocked) return;

      if (action === 'clone') {
        onCloneTile?.(tile.id);
        return;
      }

      if (action === 'flag') {
        if (tile.isFlagged) {
          onUnflagTile?.(tile.id);
          return;
        }

        if (onFlagTile) {
          setFlagDialog({ tile, note: tile.flagNote ?? '' });
        }
        return;
      }

      onDeleteTile?.(tile.id);
    },
    [
      closeContextMenu,
      contextMenu,
      isLocked,
      onCloneTile,
      onDeleteTile,
      onFlagTile,
      onSelectTile,
      onUnflagTile,
    ],
  );

  const submitFlagNote = useCallback(() => {
    if (!flagDialog) return;

    const note = flagDialog.note.trim();
    if (!note) return;

    onFlagTile?.(flagDialog.tile.id, note);
    setFlagDialog(null);
  }, [flagDialog, onFlagTile]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-gray-100 p-2">
      <div
        className="grid min-h-0 flex-1 gap-1"
        style={{
          gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`,
        }}
      >
        {rows.map((rowData) =>
          rowData.cells.map((cell) => {
            const key = `${cell.col}-${cell.row}`;
            // Skip cells occupied by a multi-column tile
            if (occupiedCells.has(key)) return null;
            const tile = tileMap.get(key) ?? null;
            const isTileDragTarget =
              dragOverCell?.col === cell.col && dragOverCell.row === cell.row;
            const canDropMovedTile = dragState?.isDragging
              ? canDropTile(dragState.tile, cell.col, cell.row)
              : false;
            const isInventoryDragTarget =
              sidebarDragOverCell?.col === cell.col &&
              sidebarDragOverCell.row === cell.row;
            const canDropInventoryHere = isInventoryDragTarget
              ? canDropSidebarItem(cell.col, cell.row)
              : false;
            const isDragTarget = isTileDragTarget || isInventoryDragTarget;
            const canDropHere = isInventoryDragTarget
              ? canDropInventoryHere
              : canDropMovedTile;

            return (
              <GridCell
                key={key}
                col={cell.col}
                row={cell.row}
                colSpan={tile?.colSpan ?? 1}
                tile={tile}
                selectedTileId={selectedTileId}
                isLocked={isLocked}
                isDragTarget={isDragTarget}
                canDropHere={canDropHere}
                onSelectTile={onSelectTile}
                onTileDragStart={handleTileDragStart}
                onTileContextMenu={handleTileContextMenu}
                onInventoryDragOver={handleInventoryDragOver}
                onInventoryDragLeave={handleInventoryDragLeave}
                onInventoryDrop={handleInventoryDrop}
              />
            );
          }),
        )}
      </div>

      {contextMenu ? (
        <TileContextMenu
          menu={contextMenu}
          isLocked={isLocked}
          hasEmptyCells={hasEmptyCells}
          canClone={Boolean(onCloneTile)}
          canDelete={Boolean(onDeleteTile)}
          canFlag={Boolean(onFlagTile)}
          canUnflag={Boolean(onUnflagTile)}
          onAction={runContextAction}
        />
      ) : null}

      {dragState?.isDragging ? (
        <div
          className="pointer-events-none fixed z-50 max-w-44 rounded-md border bg-white px-2 py-1 text-xs font-medium text-gray-900 shadow-lg"
          style={{
            left: dragState.currentX + 12,
            top: dragState.currentY + 12,
          }}
        >
          {dragState.tile.label ?? 'Tile'}
        </div>
      ) : null}

      <FlagTileDialog
        state={flagDialog}
        onStateChange={setFlagDialog}
        onSubmit={submitFlagNote}
      />
    </div>
  );
});
