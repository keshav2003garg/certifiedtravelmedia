import { Hono } from 'hono';

import { isStaffOnly } from '@repo/server-utils/middlewares/auth.middleware';
import { validator } from '@repo/server-utils/middlewares/validator.middleware';

import { createInventoryRequestHandler } from './requests.handlers';
import { createInventoryRequestValidator } from './requests.validators';

import type { AppBindings } from '@repo/server-utils/types/app.types';

const requestsRoute = new Hono<AppBindings>();

requestsRoute.post(
  '/',
  isStaffOnly,
  validator(createInventoryRequestValidator),
  createInventoryRequestHandler,
);

export default requestsRoute;
