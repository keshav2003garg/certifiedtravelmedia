import { createValidatorSchema } from '@repo/server-utils/utils/zod-validator-schema';
import { searchFilterSchema } from '@repo/server-utils/validator/filters.validator';
import { paginationSchema } from '@repo/server-utils/validator/pagination.validator';
import { createSortSchema } from '@repo/server-utils/validator/sorting.validators';
import { z } from '@repo/utils/zod';

import {
  stockLevelEnum,
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

const ALLOWED_INTAKE_TRANSACTION_TYPES = [
  'Delivery',
  'Start Count',
] as const satisfies ReadonlyArray<
  (typeof transactionTypeEnum.enumValues)[number]
>;

const ADJUSTMENT_DIRECTIONS = ['Addition', 'Subtraction'] as const;

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

const optionalInventoryTextSchema = (field: string) =>
  z
    .string()
    .trim()
    .max(255, `${field} must be 255 characters or less`)
    .optional()
    .transform((value) => (value ? value.replace(/\s+/g, ' ') : undefined));

const inventoryItemSortSchema = createSortSchema([
  'warehouseName',
  'brochureName',
  'brochureTypeName',
  'customerName',
  'boxes',
  'unitsPerBox',
  'stockLevel',
  'createdAt',
  'updatedAt',
]);

const stockLevelFilterSchema = z.enum(stockLevelEnum.enumValues).optional();
const transactionTypeFilterSchema = z
  .enum(transactionTypeEnum.enumValues)
  .optional();

const inventoryItemFilterSchema = z.object({
  search: optionalInventoryTextSchema('Search'),
  warehouseId: z.uuid('Invalid warehouse ID').optional(),
  brochureId: z.uuid('Invalid brochure ID').optional(),
  brochureTypeId: z.uuid('Invalid brochure type ID').optional(),
  stockLevel: stockLevelFilterSchema,
});

const detailTransactionBaseSchema = z.object({
  boxes: positiveBoxesSchema,
  transactionDate: z.iso.date('Transaction date must be a valid date'),
  notes: optionalTextSchema(2000, 'Notes must be 2000 characters or less'),
});

const inventoryItemIdParamSchema = z.object({
  id: z.uuid('Invalid inventory item ID'),
});

export const listInventoryItemsValidator = createValidatorSchema({
  query: paginationSchema
    .extend(searchFilterSchema.shape)
    .extend(inventoryItemSortSchema.shape)
    .extend(inventoryItemFilterSchema.shape),
});
export type ListInventoryItemsContext = TypedContext<
  typeof listInventoryItemsValidator
>;

export const downloadInventoryBulkQrLabelsValidator = createValidatorSchema({
  query: inventoryItemFilterSchema.extend(inventoryItemSortSchema.shape),
});
export type DownloadInventoryBulkQrLabelsContext = TypedContext<
  typeof downloadInventoryBulkQrLabelsValidator
>;

export const exportInventoryItemsValidator = createValidatorSchema({
  query: inventoryItemFilterSchema.extend(inventoryItemSortSchema.shape),
});
export type ExportInventoryItemsContext = TypedContext<
  typeof exportInventoryItemsValidator
>;

export const getInventoryItemValidator = createValidatorSchema({
  param: inventoryItemIdParamSchema,
});
export type GetInventoryItemContext = TypedContext<
  typeof getInventoryItemValidator
>;

export const listInventoryItemTransactionsValidator = createValidatorSchema({
  param: inventoryItemIdParamSchema,
  query: paginationSchema.extend({
    transactionType: transactionTypeFilterSchema,
    dateFrom: z.iso.date('Start date must be a valid date').optional(),
    dateTo: z.iso.date('End date must be a valid date').optional(),
  }),
});
export type ListInventoryItemTransactionsContext = TypedContext<
  typeof listInventoryItemTransactionsValidator
>;

export const createInventoryItemTransactionValidator = createValidatorSchema({
  param: inventoryItemIdParamSchema,
  json: z.discriminatedUnion('transactionType', [
    detailTransactionBaseSchema.extend({
      transactionType: z.literal('Transfer'),
      destinationWarehouseId: z.uuid('Destination warehouse is required'),
    }),
    detailTransactionBaseSchema.extend({
      transactionType: z.literal('Return to Client'),
    }),
    detailTransactionBaseSchema.extend({
      transactionType: z.literal('Recycle'),
    }),
    detailTransactionBaseSchema.extend({
      transactionType: z.literal('Adjustment'),
      adjustmentDirection: z.enum(ADJUSTMENT_DIRECTIONS),
    }),
  ]),
});

export type CreateInventoryItemTransactionContext = TypedContext<
  typeof createInventoryItemTransactionValidator
>;

export const createInventoryIntakeValidator = createValidatorSchema({
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
    boxes: positiveBoxesSchema,
    unitsPerBox: unitsPerBoxSchema,
    transactionType: z
      .enum(ALLOWED_INTAKE_TRANSACTION_TYPES)
      .default('Delivery'),
    transactionDate: z.iso.date('Transaction date must be a valid date'),
    notes: optionalTextSchema(2000, 'Notes must be 2000 characters or less'),
  }),
});

export type CreateInventoryIntakeContext = TypedContext<
  typeof createInventoryIntakeValidator
>;
