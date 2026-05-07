import { createValidatorSchema } from '@repo/server-utils/utils/zod-validator-schema';
import { searchFilterSchema } from '@repo/server-utils/validator/filters.validator';
import { paginationSchema } from '@repo/server-utils/validator/pagination.validator';
import { createSortSchema } from '@repo/server-utils/validator/sorting.validators';
import { z } from '@repo/utils/zod';

import type { TypedContext } from '@repo/server-utils/types/app.types';

function normalizeBrochureText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

const optionalTrimmedSearchSchema = z
  .string()
  .trim()
  .max(255, 'Search must be 255 characters or less')
  .optional()
  .transform((value) => (value ? normalizeBrochureText(value) : undefined));

const optionalBooleanQuerySchema = z
  .enum(['true', 'false'])
  .optional()
  .transform((value) => (value === undefined ? undefined : value === 'true'));

const brochureSortSchema = createSortSchema([
  'name',
  'brochureTypeName',
  'customerName',
  'createdAt',
  'updatedAt',
]);

export const readInventoryBrochuresValidator = createValidatorSchema({
  query: paginationSchema
    .extend(searchFilterSchema.shape)
    .extend(brochureSortSchema.shape)
    .extend({
      id: z.uuid('Invalid brochure ID').optional(),
      search: optionalTrimmedSearchSchema,
      brochureTypeId: z.uuid('Invalid brochure type ID').optional(),
      customerId: z.uuid('Invalid customer ID').optional(),
      hasImages: optionalBooleanQuerySchema,
      hasPackSizes: optionalBooleanQuerySchema,
    }),
});
export type ReadInventoryBrochuresContext = TypedContext<
  typeof readInventoryBrochuresValidator
>;
