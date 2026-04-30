import { Hono } from 'hono';

import { validator } from '@repo/server-utils/middlewares/validator.middleware';

import { getChartHandler, getChartPDFHandler } from './charts.handlers';
import { getChartValidator } from './charts.validators';

import type { AppBindings } from '@repo/server-utils/types/app.types';

const chartsRoute = new Hono<AppBindings>();

chartsRoute.get('/:locationId', validator(getChartValidator), getChartHandler);

chartsRoute.get(
  '/:locationId/pdf',
  validator(getChartValidator),
  getChartPDFHandler,
);

export default chartsRoute;
