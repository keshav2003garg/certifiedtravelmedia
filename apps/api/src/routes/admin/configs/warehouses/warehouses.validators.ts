import { createValidatorSchema } from '@repo/server-utils/utils/zod-validator-schema';
import { searchFilterSchema } from '@repo/server-utils/validator/filters.validator';
import { paginationSchema } from '@repo/server-utils/validator/pagination.validator';
import { createSortSchema } from '@repo/server-utils/validator/sorting.validators';
import { z } from '@repo/utils/zod';

import type { TypedContext } from '@repo/server-utils/types/app.types';

const warehouseIdParamSchema = z.object({
  id: z.uuid('Invalid warehouse ID'),
});

function normalizeWarehouseText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

const optionalTrimmedSearchSchema = z
  .string()
  .trim()
  .max(255, 'Search must be 255 characters or less')
  .optional()
  .transform((value) => (value ? normalizeWarehouseText(value) : undefined));

const includeInactiveQuerySchema = z
  .enum(['true', 'false'])
  .optional()
  .transform((value) => value === 'true');

const warehouseNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(255, 'Name must be 255 characters or less')
  .transform(normalizeWarehouseText);

const warehouseAcumaticaIdSchema = z
  .string()
  .trim()
  .max(50, 'Acumatica ID must be 50 characters or less');

const warehouseAddressSchema = z
  .string()
  .trim()
  .max(1000, 'Address must be 1000 characters or less');

const sectorIdsSchema = z
  .array(z.uuid('Invalid sector ID'))
  .refine((ids) => new Set(ids).size === ids.length, {
    message: 'Duplicate sector IDs are not allowed',
  });

const warehouseSortSchema = createSortSchema([
  'name',
  'acumaticaId',
  'createdAt',
  'updatedAt',
]);

export const listWarehousesValidator = createValidatorSchema({
  query: paginationSchema
    .extend(searchFilterSchema.shape)
    .extend(warehouseSortSchema.shape)
    .extend({
      search: optionalTrimmedSearchSchema,
      includeInactive: includeInactiveQuerySchema,
    }),
});
export type ListWarehousesContext = TypedContext<
  typeof listWarehousesValidator
>;

export const createWarehouseValidator = createValidatorSchema({
  json: z.object({
    name: warehouseNameSchema,
    acumaticaId: warehouseAcumaticaIdSchema.optional(),
    address: warehouseAddressSchema.optional(),
    isActive: z.boolean().optional().default(true),
    sectorIds: sectorIdsSchema.default([]),
  }),
});
export type CreateWarehouseContext = TypedContext<
  typeof createWarehouseValidator
>;

export const updateWarehouseValidator = createValidatorSchema({
  param: warehouseIdParamSchema,
  json: z
    .object({
      name: warehouseNameSchema.optional(),
      acumaticaId: warehouseAcumaticaIdSchema.optional(),
      address: warehouseAddressSchema.optional(),
      isActive: z.boolean().optional(),
      sectorIds: sectorIdsSchema.optional(),
    })
    .refine(
      (value) =>
        value.name !== undefined ||
        value.acumaticaId !== undefined ||
        value.address !== undefined ||
        value.isActive !== undefined ||
        value.sectorIds !== undefined,
      {
        message: 'At least one field must be provided',
      },
    ),
});
export type UpdateWarehouseContext = TypedContext<
  typeof updateWarehouseValidator
>;

export const warehouseIdValidator = createValidatorSchema({
  param: warehouseIdParamSchema,
});
export type WarehouseIdContext = TypedContext<typeof warehouseIdValidator>;

export const fullTruckLoadValidator = createValidatorSchema({
  param: warehouseIdParamSchema,
  query: z
    .object({
      month: z.coerce.number().int().min(1).max(12).optional(),
      year: z.coerce.number().int().min(2000).max(2100).optional(),
    })
    .refine(
      (value) =>
        (value.month === undefined && value.year === undefined) ||
        (value.month !== undefined && value.year !== undefined),
      { message: 'Month and year must be provided together' },
    ),
});
export type FullTruckLoadContext = TypedContext<typeof fullTruckLoadValidator>;

export const listSectorsValidator = createValidatorSchema({
  query: paginationSchema.extend({
    search: optionalTrimmedSearchSchema,
  }),
});
export type ListSectorsContext = TypedContext<typeof listSectorsValidator>;

export const exportWarehousesValidator = createValidatorSchema({
  query: z.object({
    includeInactive: includeInactiveQuerySchema,
  }),
});
export type ExportWarehousesContext = TypedContext<
  typeof exportWarehousesValidator
>;
