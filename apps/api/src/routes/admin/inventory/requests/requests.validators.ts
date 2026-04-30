import { createValidatorSchema } from '@repo/server-utils/utils/zod-validator-schema';
import { z } from '@repo/utils/zod';

import { transactionTypeEnum } from '@services/database/schemas';

import type { TypedContext } from '@repo/server-utils/types/app.types';

const optionalTextSchema = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value ? value.replace(/\s+/g, ' ') : undefined));

const positiveBoxesSchema = z.coerce
  .number()
  .int('Boxes must be a whole number')
  .positive('Boxes must be greater than 0');

const unitsPerBoxSchema = z.coerce
  .number()
  .positive('Units per box must be greater than 0')
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8, {
    message: 'Units per box can have at most two decimal places',
  });

export const createInventoryRequestValidator = createValidatorSchema({
  json: z.object({
    warehouseId: z.uuid('Warehouse is required'),
    brochureTypeId: z.uuid('Brochure type is required'),
    brochureName: z
      .string()
      .trim()
      .min(1, 'Brochure name is required')
      .max(255, 'Brochure name must be 255 characters or less')
      .transform((value) => value.replace(/\s+/g, ' ')),
    customerName: optionalTextSchema(
      255,
      'Customer name must be 255 characters or less',
    ),
    imageUrl: z
      .url('Image URL must be a valid URL')
      .max(500, 'Image URL must be 500 characters or less')
      .optional(),
    dateReceived: z.iso.date('Date received must be a valid date'),
    boxes: positiveBoxesSchema,
    unitsPerBox: unitsPerBoxSchema,
    transactionType: z
      .enum(transactionTypeEnum.enumValues)
      .default('Delivery')
      .refine((value) => value === 'Delivery', {
        message: 'Inventory intake requests must use Delivery',
      }),
    notes: optionalTextSchema(2000, 'Notes must be 2000 characters or less'),
  }),
});
export type CreateInventoryRequestContext = TypedContext<
  typeof createInventoryRequestValidator
>;
