import { Hono } from 'hono';

import {
  isAdmin,
  isStaffOrAbove,
} from '@repo/server-utils/middlewares/auth.middleware';
import { validator } from '@repo/server-utils/middlewares/validator.middleware';

import {
  createWarehouseHandler,
  exportWarehousesHandler,
  fullTruckLoadHandler,
  getWarehouseHandler,
  listSectorsHandler,
  listWarehousesHandler,
  retireWarehouseHandler,
  updateWarehouseHandler,
} from './warehouses.handlers';
import {
  createWarehouseValidator,
  exportWarehousesValidator,
  fullTruckLoadValidator,
  listSectorsValidator,
  listWarehousesValidator,
  updateWarehouseValidator,
  warehouseIdValidator,
} from './warehouses.validators';

import type { AppBindings } from '@repo/server-utils/types/app.types';

const warehousesRoute = new Hono<AppBindings>();

warehousesRoute.get(
  '/',
  isStaffOrAbove,
  validator(listWarehousesValidator),
  listWarehousesHandler,
);

warehousesRoute.get(
  '/sectors',
  isStaffOrAbove,
  validator(listSectorsValidator),
  listSectorsHandler,
);

warehousesRoute.get(
  '/export',
  isAdmin,
  validator(exportWarehousesValidator),
  exportWarehousesHandler,
);

warehousesRoute.get(
  '/:id/full-truck-load',
  isStaffOrAbove,
  validator(fullTruckLoadValidator),
  fullTruckLoadHandler,
);

warehousesRoute.get(
  '/:id',
  isStaffOrAbove,
  validator(warehouseIdValidator),
  getWarehouseHandler,
);

warehousesRoute.post(
  '/',
  isAdmin,
  validator(createWarehouseValidator),
  createWarehouseHandler,
);

warehousesRoute.put(
  '/:id',
  isAdmin,
  validator(updateWarehouseValidator),
  updateWarehouseHandler,
);

warehousesRoute.patch(
  '/:id',
  isAdmin,
  validator(updateWarehouseValidator),
  updateWarehouseHandler,
);

warehousesRoute.patch(
  '/:id/retire',
  isAdmin,
  validator(warehouseIdValidator),
  retireWarehouseHandler,
);

export default warehousesRoute;
