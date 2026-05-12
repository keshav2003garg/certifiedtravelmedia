export interface ChartEditorSearch {
  width: number;
  height: number;
  month: number;
  year: number;
  inventorySearch?: string;
  inventoryPage?: number;
  inventoryLimit?: number;
}

function toInteger(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function validateChartEditorSearch(
  search: Record<string, unknown>,
): ChartEditorSearch {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const validated: ChartEditorSearch = {
    width: clamp(toInteger(search.width, 0), 0, 100),
    height: clamp(toInteger(search.height, 0), 0, 100),
    month: clamp(toInteger(search.month, currentMonth), 1, 12),
    year: clamp(toInteger(search.year, currentYear), 2020, 2100),
  };

  if (
    typeof search.inventorySearch === 'string' &&
    search.inventorySearch.trim().length > 0
  ) {
    validated.inventorySearch = search.inventorySearch
      .trim()
      .replace(/\s+/g, ' ');
  }

  if (search.inventoryPage !== undefined) {
    validated.inventoryPage = clamp(
      toInteger(search.inventoryPage, 1),
      1,
      100000,
    );
  }

  if (search.inventoryLimit !== undefined) {
    validated.inventoryLimit = clamp(
      toInteger(search.inventoryLimit, 10),
      1,
      100,
    );
  }

  return validated;
}
