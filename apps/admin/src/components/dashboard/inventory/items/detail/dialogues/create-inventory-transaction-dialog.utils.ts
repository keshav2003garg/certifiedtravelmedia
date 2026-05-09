import type { CreateInventoryItemTransactionPayload } from '@/hooks/useInventoryItems/types';
import type { CreateInventoryTransactionFormData } from './create-inventory-transaction-dialog.schema';

export function normalizeOptionalTransactionText(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : undefined;
}

export function shouldReduceInventory(
  values: Pick<CreateInventoryTransactionFormData, 'boxes' | 'transactionType'>,
) {
  return values.transactionType !== 'Adjustment' || values.boxes < 0;
}

export function getInventoryReductionBoxes(
  values: Pick<CreateInventoryTransactionFormData, 'boxes' | 'transactionType'>,
) {
  return values.transactionType === 'Adjustment'
    ? Math.abs(Math.min(values.boxes, 0))
    : values.boxes;
}

export function buildInventoryTransactionPayload(
  values: CreateInventoryTransactionFormData & { boxes: number },
): CreateInventoryItemTransactionPayload {
  const base = {
    boxes: values.boxes,
    transactionDate: values.transactionDate,
    notes: normalizeOptionalTransactionText(values.notes),
  };

  if (values.transactionType === 'Transfer') {
    return {
      ...base,
      transactionType: values.transactionType,
      destinationWarehouseId: values.destinationWarehouseId,
    };
  }

  return {
    ...base,
    transactionType: values.transactionType,
  };
}
