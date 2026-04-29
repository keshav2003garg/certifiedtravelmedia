import { z } from '@repo/utils/zod';

function normalizeCustomerText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export const customerFormSchema = z.object({
  acumaticaId: z
    .string()
    .trim()
    .min(1, 'Acumatica ID is required')
    .max(50, 'Acumatica ID must be 50 characters or less'),
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less')
    .transform(normalizeCustomerText),
});

export type CustomerFormData = z.infer<typeof customerFormSchema>;

export const defaultCustomerValues = {
  acumaticaId: '',
  name: '',
} satisfies CustomerFormData;
