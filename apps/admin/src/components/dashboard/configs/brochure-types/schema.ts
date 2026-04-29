import { z } from '@repo/utils/zod';

export const BROCHURE_TYPE_COL_SPAN_MAX = 12;

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export const brochureTypeFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less')
    .transform(normalizeName),
  colSpan: z
    .number()
    .int('Column span must be a whole number')
    .min(1, 'Column span must be at least 1')
    .max(
      BROCHURE_TYPE_COL_SPAN_MAX,
      `Column span must be ${BROCHURE_TYPE_COL_SPAN_MAX} or less`,
    ),
});

export type BrochureTypeFormData = z.infer<typeof brochureTypeFormSchema>;

export const defaultBrochureTypeValues = {
  name: '',
  colSpan: 1,
} satisfies BrochureTypeFormData;
