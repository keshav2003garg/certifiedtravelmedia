import type { ValidationTargets } from 'hono';
import type { z } from '@repo/utils/zod';

export type AllowedKeys = keyof ValidationTargets;

export type ZodValidatorSchema = Partial<Record<AllowedKeys, z.core.$ZodType>>;

type NoExtraKeys<T, U extends PropertyKey = AllowedKeys> =
  Exclude<keyof T, U> extends never ? T : never;

export function createValidatorSchema<T extends ZodValidatorSchema>(
  schema: NoExtraKeys<T>,
): T {
  return schema;
}
