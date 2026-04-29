import { z } from '@repo/utils/zod';

export const pageValidator = z.coerce
  .number()
  .default(1)
  .refine((val) => val >= 1, { message: 'Page must be at least 1' });

export const limitValidator = z.coerce
  .number()
  .default(10)
  .refine((val) => val >= 1 && val <= 100, {
    message: 'Limit must be between 1 and 100',
  });

export const paginationSchema = z.object({
  page: pageValidator,
  limit: limitValidator,
});
