import { z } from '@repo/utils/zod';

function normalizeWarehouseText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export const warehouseFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less')
    .transform(normalizeWarehouseText),
  acumaticaId: z
    .string()
    .trim()
    .max(50, 'Acumatica ID must be 50 characters or less'),
  address: z.string().trim().max(500, 'Address must be 500 characters or less'),
  isActive: z.boolean(),
  sectorIds: z.array(z.uuid('Invalid sector ID')),
});

export type WarehouseFormData = z.infer<typeof warehouseFormSchema>;

export const defaultWarehouseValues = {
  name: '',
  acumaticaId: '',
  address: '',
  isActive: true,
  sectorIds: [],
} satisfies WarehouseFormData;
