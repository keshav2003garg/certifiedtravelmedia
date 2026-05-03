import { Hono } from 'hono';

import { isManagerOrAbove } from '@repo/server-utils/middlewares/auth.middleware';
import { validator } from '@repo/server-utils/middlewares/validator.middleware';

import {
  downloadCustomerYearlyReportPdfHandler,
  downloadInventoryMonthlyReportPdfHandler,
} from './reports.handlers';
import {
  customerYearlyReportValidator,
  inventoryMonthlyReportValidator,
} from './reports.validators';

import type { AppBindings } from '@repo/server-utils/types/app.types';

const reportsRoute = new Hono<AppBindings>();

reportsRoute.get(
  '/inventory/monthly/pdf',
  isManagerOrAbove,
  validator(inventoryMonthlyReportValidator),
  downloadInventoryMonthlyReportPdfHandler,
);

reportsRoute.get(
  '/customer/year-end/pdf',
  isManagerOrAbove,
  validator(customerYearlyReportValidator),
  downloadCustomerYearlyReportPdfHandler,
);

export default reportsRoute;
