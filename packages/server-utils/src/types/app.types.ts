import type { Context } from 'hono';
import type { InputToDataByTarget } from 'hono/types';
import type {
  AllowedKeys,
  ZodValidatorSchema,
} from '@repo/server-utils/utils/zod-validator-schema';
import type { z } from '@repo/utils/zod';
import type { BetterAuth } from '@services/betterauth';

type InferUser<T extends BetterAuth> = T['$Infer']['Session']['user'];
type InferSession<T extends BetterAuth> = T['$Infer']['Session']['session'];

export interface AppBindings<
  U = InferUser<BetterAuth>,
  S = InferSession<BetterAuth>,
> {
  Variables: {
    user: U | null;
    session: S | null;
  };
}

export type AppContext<
  U = InferUser<BetterAuth>,
  S = InferSession<BetterAuth>,
> = Context<AppBindings<U, S>>;

export type TypedContext<
  T extends ZodValidatorSchema,
  U = InferUser<BetterAuth>,
  S = InferSession<BetterAuth>,
> = AppContext<U, S> & {
  req: AppContext<U, S>['req'] & {
    valid<K extends AllowedKeys>(
      key: K,
    ): InputToDataByTarget<
      {
        [P in K]: T[P] extends z.ZodTypeAny ? z.infer<T[P]> : never;
      },
      K
    >;
  };
};
