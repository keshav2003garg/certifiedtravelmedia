import { z } from '@repo/utils/zod';

export const idParamSchema = z.object({
  id: z.uuid('Invalid ID format'),
});

export const textIdParamSchema = z.object({
  id: z.string().min(1, 'Invalid ID'),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});
