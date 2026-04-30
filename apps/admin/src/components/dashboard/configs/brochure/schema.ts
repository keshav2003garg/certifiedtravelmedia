import { z } from '@repo/utils/zod';

function normalizeBrochureText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

const unitsPerBoxSchema = z
  .number()
  .positive('Units per box must be greater than 0')
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8, {
    message: 'Units per box can have at most two decimal places',
  });

export const brochureFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Brochure name is required')
    .max(255, 'Brochure name must be 255 characters or less')
    .transform(normalizeBrochureText),
  brochureTypeId: z.uuid('Brochure type is required'),
  customerId: z.uuid('Invalid customer').nullable(),
});

export const brochureImageFormSchema = z.object({
  imageUrl: z
    .url('Image URL must be a valid URL')
    .max(500, 'Image URL must be 500 characters or less'),
  sortOrder: z
    .number()
    .int('Sort order must be a whole number')
    .min(0, 'Sort order must be at least 0')
    .optional(),
});

export const packSizeFormSchema = z.object({
  unitsPerBox: unitsPerBoxSchema,
});

export type BrochureFormData = z.infer<typeof brochureFormSchema>;
export type BrochureImageFormData = z.infer<typeof brochureImageFormSchema>;
export type PackSizeFormData = z.infer<typeof packSizeFormSchema>;

export const defaultBrochureValues = {
  name: '',
  brochureTypeId: '',
  customerId: null,
} satisfies BrochureFormData;

export const defaultBrochureImageValues = {
  imageUrl: '',
  sortOrder: undefined,
} satisfies BrochureImageFormData;

export const defaultPackSizeValues = {
  unitsPerBox: 1,
} satisfies PackSizeFormData;
