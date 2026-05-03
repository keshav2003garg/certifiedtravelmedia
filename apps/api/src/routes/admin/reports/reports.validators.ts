import { createValidatorSchema } from '@repo/server-utils/utils/zod-validator-schema';
import { z } from '@repo/utils/zod';

import type { TypedContext } from '@repo/server-utils/types/app.types';

export const inventoryMonthlyReportValidator = createValidatorSchema({
  query: z.object({
    warehouseId: z.uuid('Invalid warehouse ID'),
    month: z.coerce
      .number()
      .int('Month must be a whole number')
      .min(1, 'Month must be between 1 and 12')
      .max(12, 'Month must be between 1 and 12'),
    year: z.coerce
      .number()
      .int('Year must be a whole number')
      .min(2000, 'Year must be 2000 or later')
      .max(2100, 'Year must be 2100 or earlier'),
  }),
});
export type InventoryMonthlyReportContext = TypedContext<
  typeof inventoryMonthlyReportValidator
>;

export const customerYearlyReportValidator = createValidatorSchema({
  query: z.object({
    customerId: z.uuid('Invalid customer ID'),
    year: z.coerce
      .number()
      .int('Year must be a whole number')
      .min(2000, 'Year must be 2000 or later')
      .max(2100, 'Year must be 2100 or earlier'),
  }),
});
export type CustomerYearlyReportContext = TypedContext<
  typeof customerYearlyReportValidator
>;
