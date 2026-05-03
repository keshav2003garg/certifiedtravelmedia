import { createValidatorSchema } from '@repo/server-utils/utils/zod-validator-schema';
import { searchFilterSchema } from '@repo/server-utils/validator/filters.validator';
import { paginationSchema } from '@repo/server-utils/validator/pagination.validator';
import { createSortSchema } from '@repo/server-utils/validator/sorting.validators';
import { z } from '@repo/utils/zod';

import {
  inventoryRequestStatusEnum,
  transactionTypeEnum,
} from '@services/database/schemas';

import type { TypedContext } from '@repo/server-utils/types/app.types';

const optionalTextSchema = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value ? value.replace(/\s+/g, ' ') : undefined));

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

const ALLOWED_INTAKE_TRANSACTION_TYPES = [
  'Delivery',
  'Start Count',
] as const satisfies ReadonlyArray<
  (typeof transactionTypeEnum.enumValues)[number]
>;

export const createInventoryRequestValidator = createValidatorSchema({
  json: z.object({
    warehouseId: z.uuid('Warehouse is required'),
    brochureTypeId: z.uuid('Brochure type is required'),
    brochureName: z
      .string()
      .trim()
      .min(1, 'Brochure name is required')
      .max(255, 'Brochure name must be 255 characters or less')
      .transform((value) => value.replace(/\s+/g, ' ')),
    customerName: optionalTextSchema(
      255,
      'Acumatica customer must be 255 characters or less',
    ),
    imageUrl: z
      .url('Image URL must be a valid URL')
      .max(500, 'Image URL must be 500 characters or less')
      .optional(),
    dateReceived: z.iso.date('Date received must be a valid date'),
    boxes: positiveBoxesSchema,
    unitsPerBox: unitsPerBoxSchema,
    transactionType: z
      .enum(ALLOWED_INTAKE_TRANSACTION_TYPES)
      .default('Delivery'),
    notes: optionalTextSchema(2000, 'Notes must be 2000 characters or less'),
  }),
});
export type CreateInventoryRequestContext = TypedContext<
  typeof createInventoryRequestValidator
>;

const inventoryRequestSortSchema = createSortSchema([
  'createdAt',
  'updatedAt',
  'dateReceived',
  'status',
  'brochureName',
]);

const inventoryRequestStatusFilterSchema = z
  .enum(inventoryRequestStatusEnum.enumValues)
  .optional();

const inventoryRequestTypeFilterSchema = z
  .enum(transactionTypeEnum.enumValues)
  .optional();

export const listInventoryRequestsValidator = createValidatorSchema({
  query: paginationSchema
    .extend(searchFilterSchema.shape)
    .extend(inventoryRequestSortSchema.shape)
    .extend({
      search: z
        .string()
        .trim()
        .max(255, 'Search must be 255 characters or less')
        .optional()
        .transform((value) => (value ? value.replace(/\s+/g, ' ') : undefined)),
      status: inventoryRequestStatusFilterSchema,
      transactionType: inventoryRequestTypeFilterSchema,
      warehouseId: z.uuid('Invalid warehouse ID').optional(),
      brochureTypeId: z.uuid('Invalid brochure type ID').optional(),
      requestedBy: z.string().trim().min(1).max(255).optional(),
    }),
});
export type ListInventoryRequestsContext = TypedContext<
  typeof listInventoryRequestsValidator
>;

const inventoryRequestIdParamSchema = z.object({
  id: z.uuid('Invalid inventory request ID'),
});

export const inventoryRequestIdValidator = createValidatorSchema({
  param: inventoryRequestIdParamSchema,
});
export type InventoryRequestIdContext = TypedContext<
  typeof inventoryRequestIdValidator
>;

export const approveInventoryRequestValidator = createValidatorSchema({
  param: inventoryRequestIdParamSchema,
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
    dateReceived: z.iso.date('Date received must be a valid date'),
    boxes: positiveBoxesSchema,
    unitsPerBox: unitsPerBoxSchema,
    transactionType: z
      .enum(ALLOWED_INTAKE_TRANSACTION_TYPES)
      .default('Delivery'),
    notes: optionalTextSchema(2000, 'Notes must be 2000 characters or less'),
  }),
});
export type ApproveInventoryRequestContext = TypedContext<
  typeof approveInventoryRequestValidator
>;

export const rejectInventoryRequestValidator = createValidatorSchema({
  param: inventoryRequestIdParamSchema,
  json: z.object({
    rejectionReason: z
      .string()
      .trim()
      .min(1, 'Rejection reason is required')
      .max(500, 'Rejection reason must be 500 characters or less')
      .transform((value) => value.replace(/\s+/g, ' ')),
  }),
});
export type RejectInventoryRequestContext = TypedContext<
  typeof rejectInventoryRequestValidator
>;
