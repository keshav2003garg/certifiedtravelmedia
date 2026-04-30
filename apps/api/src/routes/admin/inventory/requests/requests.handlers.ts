import HttpError from '@repo/server-utils/errors/http-error';
import sendResponse from '@repo/server-utils/utils/response';

import { inventoryRequestsService } from './requests.services';

import type { AppContext } from '@repo/server-utils/types/app.types';
import type { CreateInventoryRequestContext } from './requests.validators';

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
