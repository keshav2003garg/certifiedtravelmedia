import { Hono } from 'hono';

import {
  isManagerOrAbove,
  isStaffOnly,
} from '@repo/server-utils/middlewares/auth.middleware';
import { validator } from '@repo/server-utils/middlewares/validator.middleware';

import {
  createInventoryRequestHandler,
  getInventoryRequestStatsHandler,
  listInventoryRequestsHandler,
} from './requests.handlers';
import {
  createInventoryRequestValidator,
  listInventoryRequestsValidator,
} from './requests.validators';

import type { AppBindings } from '@repo/server-utils/types/app.types';

const requestsRoute = new Hono<AppBindings>();

requestsRoute.get('/stats', isManagerOrAbove, getInventoryRequestStatsHandler);

requestsRoute.get(
  '/',
  isManagerOrAbove,
  validator(listInventoryRequestsValidator),
  listInventoryRequestsHandler,
);

requestsRoute.post(
  '/',
  isStaffOnly,
  validator(createInventoryRequestValidator),
  createInventoryRequestHandler,
);

export default requestsRoute;
