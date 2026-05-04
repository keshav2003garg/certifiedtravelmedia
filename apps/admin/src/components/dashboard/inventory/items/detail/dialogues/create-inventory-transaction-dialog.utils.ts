import type { CreateInventoryItemTransactionPayload } from '@/hooks/useInventoryItems/types';
import type { CreateInventoryTransactionFormData } from './create-inventory-transaction-dialog.schema';

export function normalizeOptionalTransactionText(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : undefined;
}

export function shouldReduceInventory(
  values: Pick<
    CreateInventoryTransactionFormData,
    'adjustmentDirection' | 'transactionType'
  >,
) {
  return (
    values.transactionType !== 'Adjustment' ||
    values.adjustmentDirection === 'Subtraction'
  );
}

export function getProjectedInventoryBalance(values: {
  adjustmentDirection: CreateInventoryTransactionFormData['adjustmentDirection'];
  boxes: number | undefined;
  currentBoxes: number;
  transactionType: CreateInventoryTransactionFormData['transactionType'];
}) {
  const boxes = values.boxes ?? 0;

  if (!shouldReduceInventory(values)) {
    return values.currentBoxes + boxes;
  }

  return values.currentBoxes - boxes;
}

export function buildInventoryTransactionPayload(
  values: CreateInventoryTransactionFormData,
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

  if (values.transactionType === 'Adjustment') {
    return {
      ...base,
      transactionType: values.transactionType,
      adjustmentDirection: values.adjustmentDirection,
    };
  }

  return {
    ...base,
    transactionType: values.transactionType,
  };
}
