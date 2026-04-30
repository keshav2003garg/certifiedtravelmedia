import sendResponse from '@repo/server-utils/utils/response';

import { locationsService } from './locations.services';

import type { AppContext } from '@repo/server-utils/types/app.types';
import type {
  GetLocationContext,
  GetLocationsBySectorContext,
  GetLocationsContext,
} from './locations.validators';

export async function getStatsHandler(ctx: AppContext) {
  const stats = await locationsService.getStats();

  return sendResponse(ctx, 200, 'Location stats retrieved successfully', {
    stats,
  });
}

export async function getLocationsHandler(ctx: GetLocationsContext) {
  const params = ctx.req.valid('query');

  const result = await locationsService.list(params);

  return sendResponse(ctx, 200, 'Locations retrieved successfully', {
    locations: result.data,
    pagination: result.pagination,
  });
}

export async function getLocationsBySectorHandler(
  ctx: GetLocationsBySectorContext,
) {
  const params = ctx.req.valid('query');

  const result = await locationsService.listBySector(params);

  return sendResponse(
    ctx,
    200,
    'Locations grouped by sector retrieved successfully',
    {
      sectors: result.data,
      pagination: result.pagination,
    },
  );
}

export async function getLocationHandler(ctx: GetLocationContext) {
  const { id } = ctx.req.valid('param');

  const location = await locationsService.getById(id);

  return sendResponse(ctx, 200, 'Location retrieved successfully', {
    location,
  });
}
