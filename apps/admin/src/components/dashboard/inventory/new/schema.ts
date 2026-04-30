import { todayISODate } from '@repo/utils/date';
import { z } from '@repo/utils/zod';

const TRANSACTION_TYPES = ['Delivery', 'Start Count'] as const;

export const inventoryIntakeFormSchema = z.object({
  brochureId: z.string().min(1, 'Brochure is required'),
  brochureImageId: z.string().min(1, 'Brochure image is required'),
  brochureImagePackSizeId: z.string().min(1, 'Pack size is required'),
  warehouseId: z.uuid('Warehouse is required'),
  boxes: z
    .number()
    .positive('Boxes must be greater than 0')
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8, {
      message: 'Boxes can have at most two decimal places',
    }),
  transactionType: z.enum(TRANSACTION_TYPES),
  transactionDate: z.iso.date('Transaction date must be a valid date'),
});

export type InventoryIntakeFormData = z.infer<typeof inventoryIntakeFormSchema>;

export function getDefaultInventoryIntakeValues(): InventoryIntakeFormData {
  return {
    brochureId: '',
    brochureImageId: '',
    brochureImagePackSizeId: '',
    warehouseId: '',
    boxes: 1,
    transactionType: 'Delivery',
    transactionDate: todayISODate(),
  };
}

export const TRANSACTION_TYPE_OPTIONS = TRANSACTION_TYPES.map((value) => ({
  value,
  label: value,
}));
