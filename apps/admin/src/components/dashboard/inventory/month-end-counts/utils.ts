import { formatDecimal } from '@repo/utils/number';

export function formatQuantity(value: number) {
  return formatDecimal(value, { maxDecimals: 2, minDecimals: 0 });
}

export function hasEditedCount(
  values: Record<string, number | null>,
  inventoryItemId: string,
) {
  return Object.prototype.hasOwnProperty.call(values, inventoryItemId);
}
