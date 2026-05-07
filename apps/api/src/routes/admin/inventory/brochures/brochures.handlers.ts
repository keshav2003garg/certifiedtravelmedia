import sendResponse from '@repo/server-utils/utils/response';

import { inventoryBrochuresService } from './brochures.services';

import type { ReadInventoryBrochuresContext } from './brochures.validators';

export async function readInventoryBrochuresHandler(
  ctx: ReadInventoryBrochuresContext,
) {
  const { id, ...params } = ctx.req.valid('query');

  if (id) {
    const brochure = await inventoryBrochuresService.getById(id);

    return sendResponse(ctx, 200, 'Brochure retrieved successfully', {
      brochure,
    });
  }

  const result = await inventoryBrochuresService.list(params);

  return sendResponse(ctx, 200, 'Brochures retrieved successfully', {
    brochures: result.data,
    pagination: result.pagination,
  });
}
