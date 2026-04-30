import { Hono } from 'hono';

import {
  isManagerOrAbove,
  isStaffOrAbove,
} from '@repo/server-utils/middlewares/auth.middleware';
import { validator } from '@repo/server-utils/middlewares/validator.middleware';

import {
  archiveChartHandler,
  cloneChartHandler,
  completeChartHandler,
  deleteTileHandler,
  getArchiveHandler,
  getChartHandler,
  getSectorChartHandler,
  initializeSectorChartHandler,
  listArchivesHandler,
  listChartsHandler,
  saveChartHandler,
  upsertTileHandler,
} from './charts.handlers';
import {
  chartIdValidator,
  cloneChartValidator,
  deleteTileValidator,
  getArchiveValidator,
  getSectorChartValidator,
  initializeSectorChartValidator,
  listArchivesValidator,
  listChartsValidator,
  saveChartValidator,
  upsertTileValidator,
} from './charts.validators';

import type { AppBindings } from '@repo/server-utils/types/app.types';

const chartsRoute = new Hono<AppBindings>();

chartsRoute.get(
  '/',
  isStaffOrAbove,
  validator(listChartsValidator),
  listChartsHandler,
);

chartsRoute.get(
  '/sectors',
  isStaffOrAbove,
  validator(listChartsValidator),
  listChartsHandler,
);

chartsRoute.get(
  '/sectors/:sectorId',
  isStaffOrAbove,
  validator(getSectorChartValidator),
  getSectorChartHandler,
);

chartsRoute.post(
  '/sectors/:sectorId/initialize',
  isManagerOrAbove,
  validator(initializeSectorChartValidator),
  initializeSectorChartHandler,
);

chartsRoute.get(
  '/archives',
  isStaffOrAbove,
  validator(listArchivesValidator),
  listArchivesHandler,
);

chartsRoute.get(
  '/archives/:id',
  isStaffOrAbove,
  validator(getArchiveValidator),
  getArchiveHandler,
);

chartsRoute.get(
  '/:id',
  isStaffOrAbove,
  validator(chartIdValidator),
  getChartHandler,
);

chartsRoute.put(
  '/:id',
  isManagerOrAbove,
  validator(saveChartValidator),
  saveChartHandler,
);

chartsRoute.patch(
  '/:id',
  isManagerOrAbove,
  validator(saveChartValidator),
  saveChartHandler,
);

chartsRoute.post(
  '/:id/tile',
  isManagerOrAbove,
  validator(upsertTileValidator),
  upsertTileHandler,
);

chartsRoute.delete(
  '/:id/tile/:tileId',
  isManagerOrAbove,
  validator(deleteTileValidator),
  deleteTileHandler,
);

chartsRoute.post(
  '/:id/complete',
  isManagerOrAbove,
  validator(chartIdValidator),
  completeChartHandler,
);

chartsRoute.post(
  '/:id/clone',
  isManagerOrAbove,
  validator(cloneChartValidator),
  cloneChartHandler,
);

chartsRoute.post(
  '/:id/archive',
  isManagerOrAbove,
  validator(chartIdValidator),
  archiveChartHandler,
);

export default chartsRoute;
