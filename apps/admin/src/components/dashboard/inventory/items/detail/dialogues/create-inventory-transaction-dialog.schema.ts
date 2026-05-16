import { z } from '@repo/utils/zod';

import {
  DELIVERY_OR_START_COUNT_TAB,
  INVENTORY_TRANSACTION_ACTION_TYPES,
  INVENTORY_TRANSACTION_TAB_VALUES,
} from './create-inventory-transaction-dialog.constants';

const boxesSchema = z.number().refine((value) => value !== 0, {
  message: 'Boxes cannot be 0',
});

export const createInventoryTransactionFormSchema = z
  .object({
    formTab: z.enum(INVENTORY_TRANSACTION_TAB_VALUES),
    transactionType: z.enum(INVENTORY_TRANSACTION_ACTION_TYPES),
    destinationWarehouseId: z.string(),
    boxes: boxesSchema.refine(
      (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
      { message: 'Boxes can have at most two decimal places' },
    ),
    notes: z.string().trim().max(2000, 'Notes must be 2000 characters or less'),
  })
  .superRefine((values, ctx) => {
    if (values.transactionType !== 'Adjustment' && values.boxes <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['boxes'],
        message: 'Boxes must be greater than 0',
      });
    }

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
    formTab: DELIVERY_OR_START_COUNT_TAB,
    transactionType: 'Delivery',
    destinationWarehouseId: '',
    boxes: 1,
    notes: '',
  };
}
