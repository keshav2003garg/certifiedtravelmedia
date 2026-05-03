import { z } from '@repo/utils/zod';

import { normalizeReviewText } from './utils';

import type { InventoryRequest } from '@/hooks/useInventoryRequests/types';

const TRANSACTION_TYPES = ['Delivery', 'Start Count'] as const;

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

export const inventoryRequestReviewFormSchema = z.object({
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
    .transform(normalizeReviewText),
  imageUrl: z
    .string()
    .trim()
    .max(500, 'Image URL must be 500 characters or less')
    .refine(isValidOptionalUrl, 'Image URL must be a valid URL'),
  dateReceived: z.iso.date('Date received must be a valid date'),
  boxes: twoDecimalPositiveNumber('Boxes'),
  unitsPerBox: twoDecimalPositiveNumber('Units per box'),
  transactionType: z.enum(TRANSACTION_TYPES),
  notes: z.string().trim().max(2000, 'Notes must be 2000 characters or less'),
});

export type InventoryRequestReviewFormData = z.infer<
  typeof inventoryRequestReviewFormSchema
>;

export function getInventoryRequestReviewValues(request: InventoryRequest) {
  return {
    warehouseId: request.warehouseId ?? '',
    brochureTypeId: request.brochureTypeId ?? '',
    customerId: '',
    customerName: request.customerName ?? '',
    brochureName: request.brochureName ?? '',
    imageUrl: request.imageUrl ?? '',
    dateReceived: request.dateReceived,
    boxes: request.boxes,
    unitsPerBox: request.unitsPerBox,
    transactionType: request.transactionType,
    notes: request.notes ?? '',
  } satisfies InventoryRequestReviewFormData;
}

export const REVIEW_TRANSACTION_TYPE_OPTIONS = TRANSACTION_TYPES.map(
  (value) => ({ value, label: value }),
);
