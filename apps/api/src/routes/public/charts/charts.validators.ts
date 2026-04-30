import { createValidatorSchema } from '@repo/server-utils/utils/zod-validator-schema';
import { z } from '@repo/utils/zod';

import type { TypedContext } from '@repo/server-utils/types/app.types';

const currentDate = new Date();
const currentMonth = currentDate.getMonth() + 1;
const currentYear = currentDate.getFullYear();

export const getChartValidator = createValidatorSchema({
  param: z.object({
    locationId: z.string().min(1, 'Location ID is required'),
  }),
  query: z.object({
    month: z.coerce.number().int().min(1).max(12).default(currentMonth),
    year: z.coerce.number().int().min(2020).max(2100).default(currentYear),
  }),
});

export type GetChartContext = TypedContext<typeof getChartValidator>;
