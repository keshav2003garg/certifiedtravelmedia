import { todayISODate } from '@repo/utils/date';
import { z } from '@repo/utils/zod';

const TRANSACTION_TYPES = ['Delivery', 'Start Count'] as const;

export function normalizeInventoryIntakeText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function isValidOptionalUrl(value: string) {
  if (!value) return true;

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

const twoDecimalPositiveNumber = (field: string) =>
  z
    .number()
    .positive(`${field} must be greater than 0`)
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8, {
      message: `${field} can have at most two decimal places`,
    });

export const inventoryIntakeFormSchema = z.object({
  warehouseId: z.uuid('Warehouse is required'),
  brochureTypeId: z.uuid('Brochure type is required'),
  customerId: z.union([z.uuid('Invalid Acumatica customer'), z.literal('')]),
  customerName: z
    .string()
    .trim()
    .max(255, 'Acumatica customer must be 255 characters or less'),
  brochureName: z
    .string()
    .trim()
    .min(1, 'Brochure name is required')
    .max(255, 'Brochure name must be 255 characters or less')
    .transform(normalizeInventoryIntakeText),
  imageUrl: z
    .string()
    .trim()
    .max(500, 'Image URL must be 500 characters or less')
    .refine(isValidOptionalUrl, 'Image URL must be a valid URL'),
  boxes: twoDecimalPositiveNumber('Boxes').optional(),
  unitsPerBox: twoDecimalPositiveNumber('Units per box').optional(),
  transactionType: z.enum(TRANSACTION_TYPES),
  transactionDate: z.iso.date('Transaction date must be a valid date'),
  notes: z.string().trim().max(2000, 'Notes must be 2000 characters or less'),
});

export type InventoryIntakeFormData = z.infer<typeof inventoryIntakeFormSchema>;

export function getDefaultInventoryIntakeValues(): InventoryIntakeFormData {
  return {
    warehouseId: '',
    brochureTypeId: '',
    customerId: '',
    customerName: '',
    brochureName: '',
    imageUrl: '',
    boxes: undefined,
    unitsPerBox: undefined,
    transactionType: 'Delivery',
    transactionDate: todayISODate(),
    notes: '',
  };
}

export const TRANSACTION_TYPE_OPTIONS = TRANSACTION_TYPES.map((value) => ({
  value,
  label: value,
}));
