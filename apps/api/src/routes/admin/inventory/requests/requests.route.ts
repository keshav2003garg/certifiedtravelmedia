import { Hono } from 'hono';

import {
  isManagerOrAbove,
  isStaffOnly,
} from '@repo/server-utils/middlewares/auth.middleware';
import { validator } from '@repo/server-utils/middlewares/validator.middleware';

import {
  approveInventoryRequestHandler,
  createInventoryRequestHandler,
  getInventoryRequestByIdHandler,
  getInventoryRequestStatsHandler,
  listInventoryRequestsHandler,
  rejectInventoryRequestHandler,
} from './requests.handlers';
import {
  approveInventoryRequestValidator,
  createInventoryRequestValidator,
  inventoryRequestIdValidator,
  listInventoryRequestsValidator,
  rejectInventoryRequestValidator,
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

requestsRoute.get(
  '/:id',
  isManagerOrAbove,
  validator(inventoryRequestIdValidator),
  getInventoryRequestByIdHandler,
);

requestsRoute.post(
  '/',
  isStaffOnly,
  validator(createInventoryRequestValidator),
  createInventoryRequestHandler,
);

requestsRoute.post(
  '/:id/approve',
  isManagerOrAbove,
  validator(approveInventoryRequestValidator),
  approveInventoryRequestHandler,
);

requestsRoute.post(
  '/:id/reject',
  isManagerOrAbove,
  validator(rejectInventoryRequestValidator),
  rejectInventoryRequestHandler,
);

export default requestsRoute;
