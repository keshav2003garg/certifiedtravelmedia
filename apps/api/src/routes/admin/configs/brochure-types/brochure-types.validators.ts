import { createValidatorSchema } from '@repo/server-utils/utils/zod-validator-schema';
import { searchFilterSchema } from '@repo/server-utils/validator/filters.validator';
import { paginationSchema } from '@repo/server-utils/validator/pagination.validator';
import { createSortSchema } from '@repo/server-utils/validator/sorting.validators';
import { z } from '@repo/utils/zod';

import type { TypedContext } from '@repo/server-utils/types/app.types';

export const BROCHURE_TYPE_COL_SPAN_MAX = 12;

function normalizeBrochureTypeName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

const brochureTypeIdParamSchema = z.object({
  id: z.uuid('Invalid brochure type ID'),
});

const brochureTypeNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(255, 'Name must be 255 characters or less')
  .transform(normalizeBrochureTypeName);

const brochureTypeColSpanSchema = z.coerce
  .number()
  .int('Column span must be a whole number')
  .min(1, 'Column span must be at least 1')
  .max(
    BROCHURE_TYPE_COL_SPAN_MAX,
    `Column span must be ${BROCHURE_TYPE_COL_SPAN_MAX} or less`,
  );

const brochureTypeSortSchema = createSortSchema([
  'name',
  'colSpan',
  'createdAt',
  'updatedAt',
]);

export const listBrochureTypesValidator = createValidatorSchema({
  query: paginationSchema
    .extend(searchFilterSchema.shape)
    .extend(brochureTypeSortSchema.shape)
    .extend({
      search: z
        .string()
        .trim()
        .max(255, 'Search must be 255 characters or less')
        .transform(normalizeBrochureTypeName)
        .optional()
        .transform((value) => value || undefined),
    }),
});
export type ListBrochureTypesContext = TypedContext<
  typeof listBrochureTypesValidator
>;

export const createBrochureTypeValidator = createValidatorSchema({
  json: z.object({
    name: brochureTypeNameSchema,
    colSpan: brochureTypeColSpanSchema.default(1),
  }),
});
export type CreateBrochureTypeContext = TypedContext<
  typeof createBrochureTypeValidator
>;

export const updateBrochureTypeValidator = createValidatorSchema({
  param: brochureTypeIdParamSchema,
  json: z
    .object({
      name: brochureTypeNameSchema.optional(),
      colSpan: brochureTypeColSpanSchema.optional(),
    })
    .refine(
      (value) => value.name !== undefined || value.colSpan !== undefined,
      {
        message: 'At least one field must be provided',
      },
    ),
});
export type UpdateBrochureTypeContext = TypedContext<
  typeof updateBrochureTypeValidator
>;

export const brochureTypeIdValidator = createValidatorSchema({
  param: brochureTypeIdParamSchema,
});
export type BrochureTypeIdContext = TypedContext<
  typeof brochureTypeIdValidator
>;

export const deleteBrochureTypeValidator = createValidatorSchema({
  param: brochureTypeIdParamSchema,
});
export type DeleteBrochureTypeContext = TypedContext<
  typeof deleteBrochureTypeValidator
>;
