import { createValidatorSchema } from '@repo/server-utils/utils/zod-validator-schema';
import { searchFilterSchema } from '@repo/server-utils/validator/filters.validator';
import { paginationSchema } from '@repo/server-utils/validator/pagination.validator';
import { createSortSchema } from '@repo/server-utils/validator/sorting.validators';
import { roundDecimals } from '@repo/utils/number';
import { z } from '@repo/utils/zod';

import type { TypedContext } from '@repo/server-utils/types/app.types';

const brochureIdParamSchema = z.object({
  id: z.uuid('Invalid brochure ID'),
});

const imageIdParamSchema = brochureIdParamSchema.extend({
  imageId: z.uuid('Invalid brochure image ID'),
});

const packSizeIdParamSchema = imageIdParamSchema.extend({
  packSizeId: z.uuid('Invalid pack size ID'),
});

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

const brochureNameSchema = z
  .string()
  .trim()
  .min(1, 'Brochure name is required')
  .max(255, 'Brochure name must be 255 characters or less')
  .transform(normalizeBrochureText);

const imageUrlSchema = z
  .url('Image URL must be a valid URL')
  .max(500, 'Image URL must be 500 characters or less');

const sortOrderSchema = z.coerce
  .number()
  .int('Sort order must be a whole number')
  .min(0, 'Sort order must be at least 0');

const unitsPerBoxSchema = z.coerce
  .number()
  .positive('Units per box must be greater than 0')
  .refine((value) => Number.isInteger(Math.round(value * 100)), {
    message: 'Units per box must be a valid number',
  })
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8, {
    message: 'Units per box can have at most two decimal places',
  });

const brochureSortSchema = createSortSchema([
  'name',
  'brochureTypeName',
  'customerName',
  'createdAt',
  'updatedAt',
]);

const createImageBodySchema = z.object({
  imageUrl: imageUrlSchema,
  sortOrder: sortOrderSchema.optional(),
  packSizes: z
    .array(
      z.object({
        unitsPerBox: unitsPerBoxSchema,
      }),
    )
    .default([])
    .refine(
      (packSizes) =>
        new Set(
          packSizes.map((packSize) => roundDecimals(packSize.unitsPerBox)),
        ).size === packSizes.length,
      { message: 'Duplicate pack sizes are not allowed' },
    ),
});

export const listBrochuresValidator = createValidatorSchema({
  query: paginationSchema
    .extend(searchFilterSchema.shape)
    .extend(brochureSortSchema.shape)
    .extend({
      search: optionalTrimmedSearchSchema,
      brochureTypeId: z.uuid('Invalid brochure type ID').optional(),
      customerId: z.uuid('Invalid customer ID').optional(),
      hasImages: optionalBooleanQuerySchema,
      hasPackSizes: optionalBooleanQuerySchema,
    }),
});
export type ListBrochuresContext = TypedContext<typeof listBrochuresValidator>;

export const brochureIdValidator = createValidatorSchema({
  param: brochureIdParamSchema,
});
export type BrochureIdContext = TypedContext<typeof brochureIdValidator>;

export const createBrochureValidator = createValidatorSchema({
  json: z.object({
    name: brochureNameSchema,
    brochureTypeId: z.uuid('Invalid brochure type ID'),
    customerId: z.uuid('Invalid customer ID').nullable().optional(),
    image: createImageBodySchema.optional(),
  }),
});
export type CreateBrochureContext = TypedContext<
  typeof createBrochureValidator
>;

export const updateBrochureValidator = createValidatorSchema({
  param: brochureIdParamSchema,
  json: z
    .object({
      name: brochureNameSchema.optional(),
      brochureTypeId: z.uuid('Invalid brochure type ID').optional(),
      customerId: z.uuid('Invalid customer ID').nullable().optional(),
    })
    .refine(
      (value) =>
        value.name !== undefined ||
        value.brochureTypeId !== undefined ||
        value.customerId !== undefined,
      { message: 'At least one field must be provided' },
    ),
});
export type UpdateBrochureContext = TypedContext<
  typeof updateBrochureValidator
>;

export const deleteBrochureValidator = createValidatorSchema({
  param: brochureIdParamSchema,
});
export type DeleteBrochureContext = TypedContext<
  typeof deleteBrochureValidator
>;

export const createBrochureImageValidator = createValidatorSchema({
  param: brochureIdParamSchema,
  json: createImageBodySchema,
});
export type CreateBrochureImageContext = TypedContext<
  typeof createBrochureImageValidator
>;

export const updateBrochureImageValidator = createValidatorSchema({
  param: imageIdParamSchema,
  json: z
    .object({
      imageUrl: imageUrlSchema.optional(),
      sortOrder: sortOrderSchema.optional(),
    })
    .refine(
      (value) => value.imageUrl !== undefined || value.sortOrder !== undefined,
      { message: 'At least one field must be provided' },
    ),
});
export type UpdateBrochureImageContext = TypedContext<
  typeof updateBrochureImageValidator
>;

export const deleteBrochureImageValidator = createValidatorSchema({
  param: imageIdParamSchema,
});
export type DeleteBrochureImageContext = TypedContext<
  typeof deleteBrochureImageValidator
>;

export const createImagePackSizeValidator = createValidatorSchema({
  param: imageIdParamSchema,
  json: z.object({
    unitsPerBox: unitsPerBoxSchema,
  }),
});
export type CreateImagePackSizeContext = TypedContext<
  typeof createImagePackSizeValidator
>;

export const updateImagePackSizeValidator = createValidatorSchema({
  param: packSizeIdParamSchema,
  json: z.object({
    unitsPerBox: unitsPerBoxSchema,
  }),
});
export type UpdateImagePackSizeContext = TypedContext<
  typeof updateImagePackSizeValidator
>;

export const deleteImagePackSizeValidator = createValidatorSchema({
  param: packSizeIdParamSchema,
});
export type DeleteImagePackSizeContext = TypedContext<
  typeof deleteImagePackSizeValidator
>;
