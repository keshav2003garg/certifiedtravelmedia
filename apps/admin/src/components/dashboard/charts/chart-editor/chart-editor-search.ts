export interface ChartEditorSearch {
  width: number;
  height: number;
  month: number;
  year: number;
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

  return {
    width: clamp(toInteger(search.width, 0), 0, 100),
    height: clamp(toInteger(search.height, 0), 0, 100),
    month: clamp(toInteger(search.month, currentMonth), 1, 12),
    year: clamp(toInteger(search.year, currentYear), 2020, 2100),
  };
}
