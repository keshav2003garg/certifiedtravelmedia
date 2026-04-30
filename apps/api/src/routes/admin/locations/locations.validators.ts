import { createValidatorSchema } from '@repo/server-utils/utils/zod-validator-schema';
import { booleanQueryParam } from '@repo/server-utils/validator/filters.validator';
import { paginationSchema } from '@repo/server-utils/validator/pagination.validator';
import { createSortSchema } from '@repo/server-utils/validator/sorting.validators';
import { z } from '@repo/utils/zod';

import type { TypedContext } from '@repo/server-utils/types/app.types';

const locationSortSchema = createSortSchema([
  'name',
  'locationId',
  'city',
  'state',
  'pocketSize',
]);

const sectorSortSchema = createSortSchema([
  'acumaticaId',
  'description',
  'locationCount',
]);

const gridSizeSchema = z.coerce
  .number()
  .int('Grid size must be a whole number')
  .min(1, 'Grid size must be at least 1')
  .max(100, 'Grid size must be at most 100')
  .optional();

const normalizedSearchSchema = z
  .string()
  .trim()
  .max(255, 'Search must be 255 characters or less')
  .optional()
  .transform((value) => (value ? value.replace(/\s+/g, ' ') : undefined));

const locationListFiltersSchema = z.object({
  search: normalizedSearchSchema,
  sectorId: z.uuid('Invalid sector ID').optional(),
  width: gridSizeSchema,
  height: gridSizeSchema,
  isDefaultPockets: booleanQueryParam.optional(),
});

export const getLocationsValidator = createValidatorSchema({
  query: paginationSchema
    .extend(locationSortSchema.shape)
    .extend(locationListFiltersSchema.shape),
});
export type GetLocationsContext = TypedContext<typeof getLocationsValidator>;

export const getLocationsBySectorValidator = createValidatorSchema({
  query: paginationSchema
    .extend(sectorSortSchema.shape)
    .extend(locationListFiltersSchema.shape),
});
export type GetLocationsBySectorContext = TypedContext<
  typeof getLocationsBySectorValidator
>;

export const getLocationValidator = createValidatorSchema({
  param: z.object({
    id: z.uuid('Invalid location ID'),
  }),
});
export type GetLocationContext = TypedContext<typeof getLocationValidator>;
