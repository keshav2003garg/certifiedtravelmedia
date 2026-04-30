import type { ChartTile } from '@/hooks/useChartEditor/types';

export interface GridPosition {
  col: number;
  row: number;
}

export interface GridSlot extends GridPosition {
  colSpan: number;
}

export function getOccupiedCells(tiles: ChartTile[], ignoredTileId?: string) {
  const occupied = new Set<string>();

  for (const tile of tiles) {
    if (tile.id === ignoredTileId) continue;

    for (let offset = 0; offset < tile.colSpan; offset += 1) {
      occupied.add(`${tile.col + offset}:${tile.row}`);
    }
  }

  return occupied;
}

export function canPlaceTileAt(
  tiles: ChartTile[],
  width: number,
  height: number,
  tileId: string,
  col: number,
  row: number,
) {
  const source = tiles.find((tile) => tile.id === tileId);
  if (!source) return false;

  const colSpan = source.colSpan ?? 1;
  if (col < 0 || row < 0 || row >= height || col + colSpan > width) {
    return false;
  }

  const occupied = getOccupiedCells(tiles, tileId);

  for (let offset = 0; offset < colSpan; offset += 1) {
    if (occupied.has(`${col + offset}:${row}`)) return false;
  }

  return true;
}

export function findFirstOpenSlot(
  tiles: ChartTile[],
  width: number,
  height: number,
  requestedColSpan: number,
): GridSlot | null {
  const colSpan = Math.max(requestedColSpan, 1);
  if (colSpan > width) return null;

  const occupied = getOccupiedCells(tiles);

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col <= width - colSpan; col += 1) {
      const fits = Array.from({ length: colSpan }).every(
        (_, offset) => !occupied.has(`${col + offset}:${row}`),
      );

      if (fits) return { col, row, colSpan };
    }
  }

  return null;
}
