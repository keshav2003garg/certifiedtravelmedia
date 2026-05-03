import { createValidatorSchema } from '@repo/server-utils/utils/zod-validator-schema';
import { z } from '@repo/utils/zod';

import type { TypedContext } from '@repo/server-utils/types/app.types';
import type { transactionTypeEnum } from '@services/database/schemas';

const optionalTextSchema = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value ? value.replace(/\s+/g, ' ') : undefined));

const ALLOWED_INTAKE_TRANSACTION_TYPES = [
  'Delivery',
  'Start Count',
] as const satisfies ReadonlyArray<
  (typeof transactionTypeEnum.enumValues)[number]
>;

const positiveBoxesSchema = z.coerce
  .number()
  .positive('Boxes must be greater than 0')
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8, {
    message: 'Boxes can have at most two decimal places',
  });

const unitsPerBoxSchema = z.coerce
  .number()
  .positive('Units per box must be greater than 0')
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8, {
    message: 'Units per box can have at most two decimal places',
  });

export const createInventoryIntakeValidator = createValidatorSchema({
  json: z.object({
    warehouseId: z.uuid('Warehouse is required'),
    brochureTypeId: z.uuid('Brochure type is required'),
    customerId: z.uuid('Invalid Acumatica customer').optional(),
    customerName: optionalTextSchema(
      255,
      'Acumatica customer must be 255 characters or less',
    ),
    brochureName: z
      .string()
      .trim()
      .min(1, 'Brochure name is required')
      .max(255, 'Brochure name must be 255 characters or less')
      .transform((value) => value.replace(/\s+/g, ' ')),
    imageUrl: z
      .url('Image URL must be a valid URL')
      .max(500, 'Image URL must be 500 characters or less')
      .optional(),
    boxes: positiveBoxesSchema,
    unitsPerBox: unitsPerBoxSchema,
    transactionType: z
      .enum(ALLOWED_INTAKE_TRANSACTION_TYPES)
      .default('Delivery'),
    transactionDate: z.iso.date('Transaction date must be a valid date'),
    notes: optionalTextSchema(2000, 'Notes must be 2000 characters or less'),
  }),
});

export type CreateInventoryIntakeContext = TypedContext<
  typeof createInventoryIntakeValidator
>;
