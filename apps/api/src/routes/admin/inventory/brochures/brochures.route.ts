import { Hono } from 'hono';

import { isStaffOrAbove } from '@repo/server-utils/middlewares/auth.middleware';
import { validator } from '@repo/server-utils/middlewares/validator.middleware';

import { readInventoryBrochuresHandler } from './brochures.handlers';
import { readInventoryBrochuresValidator } from './brochures.validators';

import type { AppBindings } from '@repo/server-utils/types/app.types';

const inventoryBrochuresRoute = new Hono<AppBindings>();

inventoryBrochuresRoute.get(
  '/',
  isStaffOrAbove,
  validator(readInventoryBrochuresValidator),
  readInventoryBrochuresHandler,
);

export default inventoryBrochuresRoute;
