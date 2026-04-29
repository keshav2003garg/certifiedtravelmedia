import { zValidator } from '@hono/zod-validator';

import HttpError from '@repo/server-utils/errors/http-error';
import { z } from '@repo/utils/zod';

import type { MiddlewareHandler } from 'hono';
import type {
  AllowedKeys,
  ZodValidatorSchema,
} from '@repo/server-utils/utils/zod-validator-schema';

export function validator<T extends ZodValidatorSchema>(
  schema: T,
): MiddlewareHandler {
  return async (c, next) => {
    for (const [key, zodSchema] of Object.entries(schema)) {
      if (zodSchema) {
        const typedKey = key as AllowedKeys;
        await zValidator(typedKey, zodSchema, (result) => {
          if (!result.success) {
            const prettyError = z.prettifyError(result.error);
            throw new HttpError(400, prettyError, 'BAD_REQUEST');
          }
        })(c, async () => {});
      }
    }

    return next();
  };
}
