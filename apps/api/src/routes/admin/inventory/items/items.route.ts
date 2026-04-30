import { Hono } from 'hono';

import { isManagerOrAbove } from '@repo/server-utils/middlewares/auth.middleware';
import { validator } from '@repo/server-utils/middlewares/validator.middleware';

import { createInventoryIntakeHandler } from './items.handlers';
import { createInventoryIntakeValidator } from './items.validators';

import type { AppBindings } from '@repo/server-utils/types/app.types';

const itemsRoute = new Hono<AppBindings>();

itemsRoute.post(
  '/intake',
  isManagerOrAbove,
  validator(createInventoryIntakeValidator),
  createInventoryIntakeHandler,
);

export default itemsRoute;
