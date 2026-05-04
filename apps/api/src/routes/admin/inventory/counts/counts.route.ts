import { Hono } from 'hono';

import { isManagerOrAbove } from '@repo/server-utils/middlewares/auth.middleware';
import { validator } from '@repo/server-utils/middlewares/validator.middleware';

import {
  bulkMonthEndCountHandler,
  listMonthEndCountsHandler,
} from './counts.handlers';
import {
  bulkMonthEndCountValidator,
  listMonthEndCountsValidator,
} from './counts.validators';

import type { AppBindings } from '@repo/server-utils/types/app.types';

const countsRoute = new Hono<AppBindings>();

countsRoute.get(
  '/',
  isManagerOrAbove,
  validator(listMonthEndCountsValidator),
  listMonthEndCountsHandler,
);

countsRoute.post(
  '/bulk',
  isManagerOrAbove,
  validator(bulkMonthEndCountValidator),
  bulkMonthEndCountHandler,
);

export default countsRoute;
