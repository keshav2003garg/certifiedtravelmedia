import { createValidatorSchema } from '@repo/server-utils/utils/zod-validator-schema';
import { searchFilterSchema } from '@repo/server-utils/validator/filters.validator';
import { paginationSchema } from '@repo/server-utils/validator/pagination.validator';
import { createSortSchema } from '@repo/server-utils/validator/sorting.validators';
import { z } from '@repo/utils/zod';

import type { TypedContext } from '@repo/server-utils/types/app.types';

const customerIdParamSchema = z.object({
  id: z.uuid('Invalid customer ID'),
});

function normalizeCustomerText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

const customerAcumaticaIdSchema = z
  .string()
  .trim()
  .min(1, 'Acumatica ID is required')
  .max(50, 'Acumatica ID must be 50 characters or less');

const customerNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(255, 'Name must be 255 characters or less')
  .transform(normalizeCustomerText);

const customerSortSchema = createSortSchema([
  'name',
  'acumaticaId',
  'createdAt',
  'updatedAt',
]);

export const listCustomersValidator = createValidatorSchema({
  query: paginationSchema
    .extend(searchFilterSchema.shape)
    .extend(customerSortSchema.shape)
    .extend({
      search: z
        .string()
        .trim()
        .max(255, 'Search must be 255 characters or less')
        .optional()
        .transform((value) =>
          value ? normalizeCustomerText(value) : undefined,
        ),
    }),
});
export type ListCustomersContext = TypedContext<typeof listCustomersValidator>;

export const createCustomerValidator = createValidatorSchema({
  json: z.object({
    acumaticaId: customerAcumaticaIdSchema,
    name: customerNameSchema,
  }),
});
export type CreateCustomerContext = TypedContext<
  typeof createCustomerValidator
>;

export const updateCustomerValidator = createValidatorSchema({
  param: customerIdParamSchema,
  json: z
    .object({
      acumaticaId: customerAcumaticaIdSchema.optional(),
      name: customerNameSchema.optional(),
    })
    .refine(
      (value) => value.acumaticaId !== undefined || value.name !== undefined,
      {
        message: 'At least one field must be provided',
      },
    ),
});
export type UpdateCustomerContext = TypedContext<
  typeof updateCustomerValidator
>;

export const customerIdValidator = createValidatorSchema({
  param: customerIdParamSchema,
});
export type CustomerIdContext = TypedContext<typeof customerIdValidator>;

export const deleteCustomerValidator = createValidatorSchema({
  param: customerIdParamSchema,
});
export type DeleteCustomerContext = TypedContext<
  typeof deleteCustomerValidator
>;
