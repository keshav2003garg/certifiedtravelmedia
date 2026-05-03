import { Hono } from 'hono';

import { isStaffOrAbove } from '@repo/server-utils/middlewares/auth.middleware';
import { validator } from '@repo/server-utils/middlewares/validator.middleware';

import { listInventoryItemsHandler } from './items/items.handlers';
import itemsRoute from './items/items.route';
import { listInventoryItemsValidator } from './items/items.validators';
import requestsRoute from './requests/requests.route';

import type { AppBindings } from '@repo/server-utils/types/app.types';

const inventoryRoute = new Hono<AppBindings>();

inventoryRoute.get(
  '/',
  isStaffOrAbove,
  validator(listInventoryItemsValidator),
  listInventoryItemsHandler,
);

inventoryRoute.route('/items', itemsRoute);
inventoryRoute.route('/requests', requestsRoute);

export default inventoryRoute;
