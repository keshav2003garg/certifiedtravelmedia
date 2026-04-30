import { createValidatorSchema } from '@repo/server-utils/utils/zod-validator-schema';
import { z } from '@repo/utils/zod';

import type { TypedContext } from '@repo/server-utils/types/app.types';
import type { transactionTypeEnum } from '@services/database/schemas';

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

export const createInventoryIntakeValidator = createValidatorSchema({
  json: z.object({
    warehouseId: z.uuid('Warehouse is required'),
    brochureImagePackSizeId: z.uuid('Pack size is required'),
    boxes: positiveBoxesSchema,
    transactionType: z
      .enum(ALLOWED_INTAKE_TRANSACTION_TYPES)
      .default('Delivery'),
    transactionDate: z.iso.date('Transaction date must be a valid date'),
  }),
});

export type CreateInventoryIntakeContext = TypedContext<
  typeof createInventoryIntakeValidator
>;
