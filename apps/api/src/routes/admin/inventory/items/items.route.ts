import { Hono } from 'hono';

import {
  isManagerOrAbove,
  isStaffOrAbove,
} from '@repo/server-utils/middlewares/auth.middleware';
import { validator } from '@repo/server-utils/middlewares/validator.middleware';

import {
  createInventoryIntakeHandler,
  createInventoryItemTransactionHandler,
  downloadInventoryBulkQrLabelsHandler,
  exportInventoryItemsHandler,
  getInventoryItemHandler,
  listInventoryItemsHandler,
  listInventoryItemTransactionsHandler,
} from './items.handlers';
import {
  createInventoryIntakeValidator,
  createInventoryItemTransactionValidator,
  downloadInventoryBulkQrLabelsValidator,
  exportInventoryItemsValidator,
  getInventoryItemValidator,
  listInventoryItemsValidator,
  listInventoryItemTransactionsValidator,
} from './items.validators';

import type { AppBindings } from '@repo/server-utils/types/app.types';

const itemsRoute = new Hono<AppBindings>();

itemsRoute.get(
  '/',
  isStaffOrAbove,
  validator(listInventoryItemsValidator),
  listInventoryItemsHandler,
);

itemsRoute.get(
  '/bulk-qr-labels',
  isStaffOrAbove,
  validator(downloadInventoryBulkQrLabelsValidator),
  downloadInventoryBulkQrLabelsHandler,
);

itemsRoute.get(
  '/export',
  isStaffOrAbove,
  validator(exportInventoryItemsValidator),
  exportInventoryItemsHandler,
);

itemsRoute.get(
  '/:id/transactions',
  isStaffOrAbove,
  validator(listInventoryItemTransactionsValidator),
  listInventoryItemTransactionsHandler,
);

itemsRoute.post(
  '/:id/transactions',
  isManagerOrAbove,
  validator(createInventoryItemTransactionValidator),
  createInventoryItemTransactionHandler,
);

itemsRoute.get(
  '/:id',
  isStaffOrAbove,
  validator(getInventoryItemValidator),
  getInventoryItemHandler,
);

itemsRoute.post(
  '/intake',
  isManagerOrAbove,
  validator(createInventoryIntakeValidator),
  createInventoryIntakeHandler,
);

export default itemsRoute;
