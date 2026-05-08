import { createValidatorSchema } from '@repo/server-utils/utils/zod-validator-schema';
import { searchFilterSchema } from '@repo/server-utils/validator/filters.validator';
import { paginationSchema } from '@repo/server-utils/validator/pagination.validator';
import { z } from '@repo/utils/zod';

import type { TypedContext } from '@repo/server-utils/types/app.types';

const endCountSchema = z.coerce
  .number()
  .min(0, 'Count cannot be negative')
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8, {
    message: 'Count can have at most two decimal places',
  });

const monthEndCountItemSchema = z.object({
  inventoryItemId: z.uuid('Invalid inventory item ID'),
  endCount: endCountSchema,
});

const optionalInventoryTextSchema = (field: string) =>
  z
    .string()
    .trim()
    .max(255, `${field} must be 255 characters or less`)
    .optional()
    .transform((value) => (value ? value.replace(/\s+/g, ' ') : undefined));

export const listMonthEndCountsValidator = createValidatorSchema({
  query: paginationSchema.extend(searchFilterSchema.shape).extend({
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
    search: optionalInventoryTextSchema('Search'),
    warehouseId: z.uuid('Invalid warehouse ID').optional(),
    brochureTypeId: z.uuid('Invalid brochure type ID').optional(),
  }),
});

export type ListMonthEndCountsContext = TypedContext<
  typeof listMonthEndCountsValidator
>;

export const bulkMonthEndCountValidator = createValidatorSchema({
  json: z
    .object({
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
      counts: z
        .array(monthEndCountItemSchema)
        .min(1, 'At least one inventory item is required')
        .max(500, 'You can submit up to 500 counts at once'),
    })
    .refine(
      (value) =>
        new Set(value.counts.map((count) => count.inventoryItemId)).size ===
        value.counts.length,
      { message: 'Duplicate inventory items are not allowed' },
    ),
});
export type BulkMonthEndCountContext = TypedContext<
  typeof bulkMonthEndCountValidator
>;
