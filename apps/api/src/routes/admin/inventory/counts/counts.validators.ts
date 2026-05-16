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

const inventoryItemIdParamSchema = z.object({
  id: z.uuid('Invalid inventory item ID'),
});

const monthSchema = z.coerce
  .number()
  .int('Month must be a whole number')
  .min(1, 'Month must be between 1 and 12')
  .max(12, 'Month must be between 1 and 12');

const yearSchema = z.coerce
  .number()
  .int('Year must be a whole number')
  .min(2000, 'Year must be 2000 or later')
  .max(2100, 'Year must be 2100 or earlier');

/**
 * Returns the {month, year} pair for the current calendar month
 * (server time).
 */
export function getCurrentMonthPeriod() {
  const now = new Date();
  return {
    month: now.getUTCMonth() + 1,
    year: now.getUTCFullYear(),
  };
}

/**
 * Returns the {month, year} pair for the calendar month immediately
 * preceding the current server month.
 */
export function getPreviousMonthPeriod() {
  const current = getCurrentMonthPeriod();

  if (current.month === 1) {
    return { month: 12, year: current.year - 1 };
  }

  return { month: current.month - 1, year: current.year };
}

/**
 * Month-end counts may be recorded only for the current month or the
 * immediately preceding month. Both periods are derived from server
 * time at the moment of validation — the client cannot pick anything
 * else.
 */
export function getAllowedCountPeriods() {
  return [getPreviousMonthPeriod(), getCurrentMonthPeriod()] as const;
}

function isAllowedCountPeriod(month: number, year: number) {
  return getAllowedCountPeriods().some(
    (period) => period.month === month && period.year === year,
  );
}

const optionalInventoryTextSchema = (field: string) =>
  z
    .string()
    .trim()
    .max(255, `${field} must be 255 characters or less`)
    .optional()
    .transform((value) => (value ? value.replace(/\s+/g, ' ') : undefined));

const monthEndCountsListQuerySchema = paginationSchema
  .extend(searchFilterSchema.shape)
  .extend({
    month: monthSchema,
    year: yearSchema,
    search: optionalInventoryTextSchema('Search'),
    warehouseId: z.uuid('Invalid warehouse ID').optional(),
    brochureTypeId: z.uuid('Invalid brochure type ID').optional(),
  });

export const listMonthEndCountsValidator = createValidatorSchema({
  query: monthEndCountsListQuerySchema,
});

export type ListMonthEndCountsContext = TypedContext<
  typeof listMonthEndCountsValidator
>;

export const listSubmittedMonthEndCountsValidator = createValidatorSchema({
  query: monthEndCountsListQuerySchema,
});

export type ListSubmittedMonthEndCountsContext = TypedContext<
  typeof listSubmittedMonthEndCountsValidator
>;

export const bulkMonthEndCountValidator = createValidatorSchema({
  json: z
    .object({
      month: monthSchema,
      year: yearSchema,
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
    )
    .refine((value) => isAllowedCountPeriod(value.month, value.year), {
      message:
        'Month-end counts can only be recorded for the current or previous calendar month',
      path: ['month'],
    }),
});
export type BulkMonthEndCountContext = TypedContext<
  typeof bulkMonthEndCountValidator
>;

export const resolveScanInventoryItemValidator = createValidatorSchema({
  param: inventoryItemIdParamSchema,
});
export type ResolveScanInventoryItemContext = TypedContext<
  typeof resolveScanInventoryItemValidator
>;

export const getScanInventoryItemValidator = createValidatorSchema({
  param: inventoryItemIdParamSchema,
});
export type GetScanInventoryItemContext = TypedContext<
  typeof getScanInventoryItemValidator
>;

export const saveScanMonthEndCountValidator = createValidatorSchema({
  param: inventoryItemIdParamSchema,
  json: z
    .object({
      month: monthSchema,
      year: yearSchema,
      endCount: endCountSchema,
    })
    .refine((value) => isAllowedCountPeriod(value.month, value.year), {
      message:
        'Month-end counts can only be recorded for the current or previous calendar month',
      path: ['month'],
    }),
});
export type SaveScanMonthEndCountContext = TypedContext<
  typeof saveScanMonthEndCountValidator
>;
