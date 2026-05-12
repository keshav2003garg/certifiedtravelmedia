import { Hono } from 'hono';

import {
  isManagerOrAbove,
  isStaffOrAbove,
} from '@repo/server-utils/middlewares/auth.middleware';
import { validator } from '@repo/server-utils/middlewares/validator.middleware';

import {
  bulkMonthEndCountHandler,
  getScanInventoryItemHandler,
  listMonthEndCountsHandler,
  listSubmittedMonthEndCountsHandler,
  resolveScanInventoryItemHandler,
  saveScanMonthEndCountHandler,
} from './counts.handlers';
import {
  bulkMonthEndCountValidator,
  getScanInventoryItemValidator,
  listMonthEndCountsValidator,
  listSubmittedMonthEndCountsValidator,
  resolveScanInventoryItemValidator,
  saveScanMonthEndCountValidator,
} from './counts.validators';

import type { AppBindings } from '@repo/server-utils/types/app.types';

const countsRoute = new Hono<AppBindings>();

countsRoute.get(
  '/scan/:id/resolve',
  isStaffOrAbove,
  validator(resolveScanInventoryItemValidator),
  resolveScanInventoryItemHandler,
);

countsRoute.get(
  '/scan/:id',
  isStaffOrAbove,
  validator(getScanInventoryItemValidator),
  getScanInventoryItemHandler,
);

countsRoute.post(
  '/scan/:id',
  isStaffOrAbove,
  validator(saveScanMonthEndCountValidator),
  saveScanMonthEndCountHandler,
);

countsRoute.get(
  '/submitted',
  isManagerOrAbove,
  validator(listSubmittedMonthEndCountsValidator),
  listSubmittedMonthEndCountsHandler,
);

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
