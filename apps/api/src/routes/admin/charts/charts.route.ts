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
  createCustomFillerHandler,
  deleteTileHandler,
  exportPocketsSoldReportHandler,
  getArchiveHandler,
  getChartHandler,
  getSectorChartHandler,
  getSectorChartsPdfHandler,
  initializeSectorChartHandler,
  listArchivesHandler,
  listChartsHandler,
  listCustomFillersHandler,
  saveChartHandler,
  upsertTileHandler,
} from './charts.handlers';
import {
  chartIdValidator,
  cloneChartValidator,
  createCustomFillerValidator,
  deleteTileValidator,
  exportPocketsSoldReportValidator,
  getArchiveValidator,
  getSectorChartValidator,
  initializeSectorChartValidator,
  listArchivesValidator,
  listChartsValidator,
  listCustomFillersValidator,
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
  '/pockets-sold-report',
  isStaffOrAbove,
  validator(exportPocketsSoldReportValidator),
  exportPocketsSoldReportHandler,
);

chartsRoute.get(
  '/sectors/:sectorId',
  isStaffOrAbove,
  validator(getSectorChartValidator),
  getSectorChartHandler,
);

chartsRoute.get(
  '/sectors/:sectorId/pdf',
  isStaffOrAbove,
  validator(getSectorChartValidator),
  getSectorChartsPdfHandler,
);

chartsRoute.post(
  '/sectors/:sectorId/initialize',
  isManagerOrAbove,
  validator(initializeSectorChartValidator),
  initializeSectorChartHandler,
);

chartsRoute.get(
  '/custom-fillers',
  isStaffOrAbove,
  validator(listCustomFillersValidator),
  listCustomFillersHandler,
);

chartsRoute.post(
  '/custom-fillers',
  isManagerOrAbove,
  validator(createCustomFillerValidator),
  createCustomFillerHandler,
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
