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

export function canPlaceNewTileAt(
  tiles: ChartTile[],
  width: number,
  height: number,
  requestedColSpan: number,
  col: number,
  row: number,
) {
  const colSpan = Math.max(requestedColSpan, 1);
  if (col < 0 || row < 0 || row >= height || col + colSpan > width) {
    return false;
  }

  const occupied = getOccupiedCells(tiles);

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

function getTileCells(tile: Pick<ChartTile, 'col' | 'row' | 'colSpan'>) {
  return Array.from(
    { length: Math.max(tile.colSpan ?? 1, 1) },
    (_, offset) => `${tile.col + offset}:${tile.row}`,
  );
}

function getTargetCells(col: number, row: number, colSpan: number) {
  return Array.from(
    { length: Math.max(colSpan, 1) },
    (_, offset) => `${col + offset}:${row}`,
  );
}

function getOverlappingTiles(
  tiles: ChartTile[],
  col: number,
  row: number,
  colSpan: number,
) {
  const targetCells = new Set(getTargetCells(col, row, colSpan));

  return tiles.filter((tile) =>
    getTileCells(tile).some((cell) => targetCells.has(cell)),
  );
}

export function findNextOpenSlot(
  tiles: ChartTile[],
  width: number,
  height: number,
  requestedColSpan: number,
  from: GridPosition,
): GridSlot | null {
  const colSpan = Math.max(requestedColSpan, 1);
  if (colSpan > width) return null;

  const occupied = getOccupiedCells(tiles);
  const totalCells = width * height;
  const startIndex = from.row * width + from.col;

  for (let step = 1; step <= totalCells; step += 1) {
    const index = (startIndex + step) % totalCells;
    const row = Math.floor(index / width);
    const col = index % width;

    if (col + colSpan > width) continue;

    const fits = Array.from({ length: colSpan }).every(
      (_, offset) => !occupied.has(`${col + offset}:${row}`),
    );

    if (fits) return { col, row, colSpan };
  }

  return null;
}

export function placeTileWithDisplacement(
  tiles: ChartTile[],
  width: number,
  height: number,
  tileToPlace: ChartTile,
  col: number,
  row: number,
) {
  const colSpan = Math.max(tileToPlace.colSpan ?? 1, 1);
  if (col < 0 || row < 0 || row >= height || col + colSpan > width) {
    return null;
  }

  const tilesWithoutSource = tiles.filter((tile) => tile.id !== tileToPlace.id);
  const displacedTiles = getOverlappingTiles(
    tilesWithoutSource,
    col,
    row,
    colSpan,
  ).sort((a, b) => a.row - b.row || a.col - b.col);
  const displacedIds = new Set(displacedTiles.map((tile) => tile.id));
  const result = [
    ...tilesWithoutSource.filter((tile) => !displacedIds.has(tile.id)),
    { ...tileToPlace, col, row, colSpan },
  ];

  for (const displacedTile of displacedTiles) {
    const slot = findNextOpenSlot(
      result,
      width,
      height,
      displacedTile.colSpan,
      displacedTile,
    );

    if (!slot) return null;

    result.push({ ...displacedTile, col: slot.col, row: slot.row });
  }

  return result;
}

export function canPlaceTileWithDisplacement(
  tiles: ChartTile[],
  width: number,
  height: number,
  tileToPlace: ChartTile,
  col: number,
  row: number,
) {
  return Boolean(
    placeTileWithDisplacement(tiles, width, height, tileToPlace, col, row),
  );
}

export function findFirstDisplacingSlot(
  tiles: ChartTile[],
  width: number,
  height: number,
  tileToPlace: ChartTile,
): GridPosition | null {
  const openSlot = findFirstOpenSlot(
    tiles.filter((tile) => tile.id !== tileToPlace.id),
    width,
    height,
    tileToPlace.colSpan,
  );

  if (openSlot) return openSlot;

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col <= width - tileToPlace.colSpan; col += 1) {
      if (
        canPlaceTileWithDisplacement(
          tiles,
          width,
          height,
          tileToPlace,
          col,
          row,
        )
      ) {
        return { col, row };
      }
    }
  }

  return null;
}
