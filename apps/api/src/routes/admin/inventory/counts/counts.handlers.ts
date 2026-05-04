import sendResponse from '@repo/server-utils/utils/response';

import { inventoryCountsService } from './counts.services';

import type {
  BulkMonthEndCountContext,
  ListMonthEndCountsContext,
} from './counts.validators';

export async function listMonthEndCountsHandler(
  ctx: ListMonthEndCountsContext,
) {
  const query = ctx.req.valid('query');
  const result = await inventoryCountsService.list(query);

  return sendResponse(ctx, 200, 'Month-end counts retrieved successfully', {
    items: result.data,
    pagination: result.pagination,
  });
}

export async function bulkMonthEndCountHandler(ctx: BulkMonthEndCountContext) {
  const user = ctx.get('user')!;
  const body = ctx.req.valid('json');
  const result = await inventoryCountsService.bulkMonthEndCount(body, user.id);

  return sendResponse(ctx, 200, 'Month-end counts saved successfully', {
    counts: result.counts,
  });
}
