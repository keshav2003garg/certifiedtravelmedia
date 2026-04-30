import { todayISODate } from '@repo/utils/date';
import { z } from '@repo/utils/zod';

function normalizeText(value: string) {
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

export const inventoryRequestFormSchema = z.object({
  warehouseId: z.uuid('Warehouse is required'),
  brochureTypeId: z.uuid('Brochure type is required'),
  brochureName: z
    .string()
    .trim()
    .min(1, 'Brochure name is required')
    .max(255, 'Brochure name must be 255 characters or less')
    .transform(normalizeText),
  customerName: z
    .string()
    .trim()
    .max(255, 'Customer name must be 255 characters or less'),
  imageUrl: z
    .string()
    .trim()
    .max(500, 'Image URL must be 500 characters or less')
    .refine(isValidOptionalUrl, 'Image URL must be a valid URL'),
  dateReceived: z.iso.date('Date received must be a valid date'),
  boxes: z
    .number()
    .positive('Boxes must be greater than 0')
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8, {
      message: 'Boxes can have at most two decimal places',
    }),
  unitsPerBox: z
    .number()
    .positive('Units per box must be greater than 0')
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8, {
      message: 'Units per box can have at most two decimal places',
    }),
  notes: z.string().trim().max(2000, 'Notes must be 2000 characters or less'),
});

export type InventoryRequestFormData = z.infer<
  typeof inventoryRequestFormSchema
>;

export function getDefaultInventoryRequestValues() {
  return {
    warehouseId: '',
    brochureTypeId: '',
    brochureName: '',
    customerName: '',
    imageUrl: '',
    dateReceived: todayISODate(),
    boxes: 1,
    unitsPerBox: 1,
    notes: '',
  } satisfies InventoryRequestFormData;
}
