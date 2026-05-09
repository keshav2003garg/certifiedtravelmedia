import { createValidatorSchema } from '@repo/server-utils/utils/zod-validator-schema';
import { paginationSchema } from '@repo/server-utils/validator/pagination.validator';
import { z } from '@repo/utils/zod';

import { tileTypeEnum } from '@services/database/schemas';

import type { TypedContext } from '@repo/server-utils/types/app.types';

const currentDate = new Date();
const currentMonth = currentDate.getMonth() + 1;
const currentYear = currentDate.getFullYear();

const monthSchema = z.coerce
  .number()
  .int('Month must be a whole number')
  .min(1, 'Month must be at least 1')
  .max(12, 'Month must be at most 12');

const yearSchema = z.coerce
  .number()
  .int('Year must be a whole number')
  .min(2020, 'Year must be at least 2020')
  .max(2100, 'Year must be at most 2100');

const gridSizeSchema = z.coerce
  .number()
  .int('Grid size must be a whole number')
  .min(1, 'Grid size must be at least 1')
  .max(100, 'Grid size must be at most 100');

const optionalTrimmedSearchSchema = z
  .string()
  .trim()
  .max(255, 'Search must be 255 characters or less')
  .optional()
  .transform((value) => (value ? value.replace(/\s+/g, ' ') : undefined));

const chartIdParamSchema = z.object({
  id: z.uuid('Invalid chart layout ID'),
});

const sectorIdParamSchema = z.object({
  sectorId: z.uuid('Invalid sector ID'),
});

const tileIdParamSchema = chartIdParamSchema.extend({
  tileId: z.uuid('Invalid tile ID'),
});

const tileSchema = z
  .object({
    id: z.uuid('Invalid tile ID').optional(),
    col: z.coerce.number().int().min(0, 'Column must be at least 0'),
    row: z.coerce.number().int().min(0, 'Row must be at least 0'),
    colSpan: z.coerce
      .number()
      .int('Column span must be a whole number')
      .min(1, 'Column span must be at least 1')
      .max(100, 'Column span must be at most 100')
      .default(1),
    tileType: z.enum(tileTypeEnum.enumValues),
    inventoryItemId: z.uuid('Invalid inventory item ID').nullable().optional(),
    contractId: z.uuid('Invalid contract ID').nullable().optional(),
    customFillerId: z.uuid('Invalid custom filler ID').nullable().optional(),
    brochureTypeId: z.uuid('Invalid brochure type ID').nullable().optional(),
    label: z.string().trim().max(255).nullable().optional(),
    coverPhotoUrl: z.string().trim().max(500).nullable().optional(),
    isNew: z.boolean().optional(),
    isFlagged: z.boolean().optional(),
    flagNote: z.string().trim().max(2000).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    const referenceCount = [
      value.contractId,
      value.inventoryItemId,
      value.customFillerId,
    ].filter(Boolean).length;

    if (referenceCount > 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['customFillerId'],
        message:
          'A tile can reference only one contract, inventory item, or custom filler',
      });
    }

    if (
      value.tileType === 'Paid' &&
      (value.inventoryItemId || value.customFillerId)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['tileType'],
        message: 'Paid tiles must reference contracts only',
      });
    }

    if (value.tileType === 'Filler' && value.contractId) {
      ctx.addIssue({
        code: 'custom',
        path: ['contractId'],
        message: 'Inventory filler tiles cannot reference contracts',
      });
    }
  });

export const listCustomFillersValidator = createValidatorSchema({
  query: paginationSchema.extend({
    search: optionalTrimmedSearchSchema,
  }),
});
export type ListCustomFillersContext = TypedContext<
  typeof listCustomFillersValidator
>;

export const createCustomFillerValidator = createValidatorSchema({
  json: z.object({
    name: z
      .string()
      .trim()
      .min(1, 'Filler name is required')
      .max(255, 'Filler name must be 255 characters or less')
      .transform((value) => value.replace(/\s+/g, ' ')),
  }),
});
export type CreateCustomFillerContext = TypedContext<
  typeof createCustomFillerValidator
>;

export const listChartsValidator = createValidatorSchema({
  query: paginationSchema.extend({
    month: monthSchema.default(currentMonth),
    year: yearSchema.default(currentYear),
    search: optionalTrimmedSearchSchema,
  }),
});
export type ListChartsContext = TypedContext<typeof listChartsValidator>;

export const exportPocketsSoldReportValidator = createValidatorSchema({
  query: z.object({
    year: yearSchema.default(currentYear),
    search: optionalTrimmedSearchSchema,
  }),
});
export type ExportPocketsSoldReportContext = TypedContext<
  typeof exportPocketsSoldReportValidator
>;

export const getSectorChartValidator = createValidatorSchema({
  param: sectorIdParamSchema,
  query: z.object({
    width: gridSizeSchema,
    height: gridSizeSchema,
    month: monthSchema.default(currentMonth),
    year: yearSchema.default(currentYear),
  }),
});
export type GetSectorChartContext = TypedContext<
  typeof getSectorChartValidator
>;

export const initializeSectorChartValidator = createValidatorSchema({
  param: sectorIdParamSchema,
  json: z.object({
    width: gridSizeSchema,
    height: gridSizeSchema,
    month: monthSchema,
    year: yearSchema,
  }),
});
export type InitializeSectorChartContext = TypedContext<
  typeof initializeSectorChartValidator
>;

export const chartIdValidator = createValidatorSchema({
  param: chartIdParamSchema,
});
export type ChartIdContext = TypedContext<typeof chartIdValidator>;

export const saveChartValidator = createValidatorSchema({
  param: chartIdParamSchema,
  json: z.object({
    tiles: z.array(tileSchema).max(10000, 'Chart has too many tiles'),
    generalNotes: z.string().trim().max(5000).nullable().optional(),
  }),
});
export type SaveChartContext = TypedContext<typeof saveChartValidator>;

export const upsertTileValidator = createValidatorSchema({
  param: chartIdParamSchema,
  json: tileSchema,
});
export type UpsertTileContext = TypedContext<typeof upsertTileValidator>;

export const deleteTileValidator = createValidatorSchema({
  param: tileIdParamSchema,
});
export type DeleteTileContext = TypedContext<typeof deleteTileValidator>;

export const cloneChartValidator = createValidatorSchema({
  param: chartIdParamSchema,
  json: z
    .object({
      force: z.boolean().optional(),
    })
    .optional(),
});
export type CloneChartContext = TypedContext<typeof cloneChartValidator>;

export const listArchivesValidator = createValidatorSchema({
  query: paginationSchema.extend({
    month: monthSchema.optional(),
    year: yearSchema.optional(),
    sectorId: z.uuid('Invalid sector ID').optional(),
    search: optionalTrimmedSearchSchema,
  }),
});
export type ListArchivesContext = TypedContext<typeof listArchivesValidator>;

export const getArchiveValidator = createValidatorSchema({
  param: chartIdParamSchema,
});
export type GetArchiveContext = TypedContext<typeof getArchiveValidator>;
