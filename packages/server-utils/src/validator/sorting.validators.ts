import { z } from '@repo/utils/zod';

export function createSortSchema<
  const T extends readonly [string, ...string[]],
>(sortableFields: T) {
  return z.object({
    sortBy: z.enum(sortableFields).optional(),
    order: z.enum(['asc', 'desc']).optional(),
  });
}
