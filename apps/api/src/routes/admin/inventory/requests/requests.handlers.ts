import HttpError from '@repo/server-utils/errors/http-error';
import sendResponse from '@repo/server-utils/utils/response';

import { inventoryRequestsService } from './requests.services';

import type { AppContext } from '@repo/server-utils/types/app.types';
import type {
  CreateInventoryRequestContext,
  ListInventoryRequestsContext,
} from './requests.validators';

function getAuthenticatedUserId(ctx: AppContext) {
  const user = ctx.get('user');

  if (!user) {
    throw new HttpError(401, 'Authentication required', 'UNAUTHORIZED');
  }

  return user.id;
}

export async function createInventoryRequestHandler(
  ctx: CreateInventoryRequestContext,
) {
  const body = ctx.req.valid('json');
  const request = await inventoryRequestsService.create(
    body,
    getAuthenticatedUserId(ctx),
  );

  return sendResponse(ctx, 201, 'Inventory request submitted successfully', {
    request,
  });
}

export async function listInventoryRequestsHandler(
  ctx: ListInventoryRequestsContext,
) {
  const params = ctx.req.valid('query');

  const result = await inventoryRequestsService.list(params);

  return sendResponse(ctx, 200, 'Inventory requests retrieved successfully', {
    requests: result.data,
    pagination: result.pagination,
  });
}

export async function getInventoryRequestStatsHandler(ctx: AppContext) {
  const stats = await inventoryRequestsService.getStats();

  return sendResponse(
    ctx,
    200,
    'Inventory request stats retrieved successfully',
    { stats },
  );
}
