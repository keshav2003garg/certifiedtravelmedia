import { z } from '@repo/utils/zod';

export const searchFilterSchema = z.object({
  search: z.string().optional(),
});

export const booleanQueryParam = z
  .enum(['true', 'false'])
  .transform((v) => v === 'true');

export function createRangeFilterSchema<const T extends readonly string[]>(
  filterableFields: T,
) {
  type SchemaShape = {
    [K in T[number] as `${K}Min` | `${K}Max`]: z.ZodOptional<z.ZodNumber>;
  };

  const schemaShape = filterableFields.reduce(
    (acc, field) => {
      acc[`${field}Min`] = z.coerce.number().optional();
      acc[`${field}Max`] = z.coerce.number().optional();
      return acc;
    },
    {} as Record<string, z.ZodOptional<z.ZodCoercedNumber>>,
  );

  return z.object(schemaShape as SchemaShape);
}
