import { z } from '@repo/utils/zod';

export const pageValidator = z.coerce
  .number()
  .default(1)
  .refine((val) => val >= 1, { message: 'Page must be at least 1' });

export const pageSizeValidator = z.coerce
  .number()
  .default(10)
  .refine((val) => val >= 1 && val <= 100, {
    message: 'Page size must be between 1 and 100',
  });

export const paginationSchema = z.object({
  page: pageValidator,
  pageSize: pageSizeValidator,
});
