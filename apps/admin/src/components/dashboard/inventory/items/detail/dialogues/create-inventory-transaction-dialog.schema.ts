import { todayISODate } from '@repo/utils/date';
import { z } from '@repo/utils/zod';

import {
  INVENTORY_ADJUSTMENT_DIRECTIONS,
  INVENTORY_TRANSACTION_ACTION_TYPES,
} from './create-inventory-transaction-dialog.constants';

export const createInventoryTransactionFormSchema = z
  .object({
    transactionType: z.enum(INVENTORY_TRANSACTION_ACTION_TYPES),
    adjustmentDirection: z.enum(INVENTORY_ADJUSTMENT_DIRECTIONS),
    destinationWarehouseId: z.string(),
    boxes: z
      .number()
      .positive('Boxes must be greater than 0')
      .refine(
        (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
        { message: 'Boxes can have at most two decimal places' },
      ),
    transactionDate: z.iso.date('Transaction date must be a valid date'),
    notes: z.string().trim().max(2000, 'Notes must be 2000 characters or less'),
  })
  .superRefine((values, ctx) => {
    if (values.transactionType !== 'Transfer') return;

    if (!values.destinationWarehouseId) {
      ctx.addIssue({
        code: 'custom',
        path: ['destinationWarehouseId'],
        message: 'Destination warehouse is required',
      });
    }
  });

export type CreateInventoryTransactionFormData = z.infer<
  typeof createInventoryTransactionFormSchema
>;

export function getDefaultInventoryTransactionValues(): CreateInventoryTransactionFormData {
  return {
    transactionType: 'Transfer',
    adjustmentDirection: 'Subtraction',
    destinationWarehouseId: '',
    boxes: 1,
    transactionDate: todayISODate(),
    notes: '',
  };
}
