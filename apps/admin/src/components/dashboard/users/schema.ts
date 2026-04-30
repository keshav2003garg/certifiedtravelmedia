import { z } from '@repo/utils/zod';

import { USER_ROLES } from '@/hooks/useUsers/types';

export const ROLES = USER_ROLES;

export const createUserSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be 128 characters or less'),
  role: z.enum(ROLES, { message: 'Role is required' }),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

export const editUserSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less'),
  role: z.enum(ROLES, { message: 'Role is required' }),
});

export type EditUserFormData = z.infer<typeof editUserSchema>;

export const banUserSchema = z.object({
  banReason: z
    .string()
    .max(500, 'Reason must be 500 characters or less')
    .optional(),
  banExpiresInDays: z
    .number()
    .int()
    .min(0, 'Must be 0 or more')
    .max(365, 'Must be 365 days or less')
    .optional(),
});

export type BanUserFormData = z.infer<typeof banUserSchema>;

export const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be 128 characters or less'),
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
