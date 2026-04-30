import { Hono } from 'hono';

import { isStaffOrAbove } from '@repo/server-utils/middlewares/auth.middleware';
import { validator } from '@repo/server-utils/middlewares/validator.middleware';

import {
  getLocationHandler,
  getLocationsBySectorHandler,
  getLocationsHandler,
  getStatsHandler,
} from './locations.handlers';
import {
  getLocationsBySectorValidator,
  getLocationsValidator,
  getLocationValidator,
} from './locations.validators';

import type { AppBindings } from '@repo/server-utils/types/app.types';

const locationsRoute = new Hono<AppBindings>();

locationsRoute.get('/stats', isStaffOrAbove, getStatsHandler);

locationsRoute.get(
  '/',
  isStaffOrAbove,
  validator(getLocationsValidator),
  getLocationsHandler,
);

locationsRoute.get(
  '/by-sector',
  isStaffOrAbove,
  validator(getLocationsBySectorValidator),
  getLocationsBySectorHandler,
);

locationsRoute.get(
  '/:id',
  isStaffOrAbove,
  validator(getLocationValidator),
  getLocationHandler,
);

export default locationsRoute;
