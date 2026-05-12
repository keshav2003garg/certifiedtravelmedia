import sendResponse from '@repo/server-utils/utils/response';

import { inventoryCountsService } from './counts.services';

import type {
  BulkMonthEndCountContext,
  GetScanInventoryItemContext,
  ListMonthEndCountsContext,
  ListSubmittedMonthEndCountsContext,
  ResolveScanInventoryItemContext,
  SaveScanMonthEndCountContext,
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

export async function listSubmittedMonthEndCountsHandler(
  ctx: ListSubmittedMonthEndCountsContext,
) {
  const query = ctx.req.valid('query');
  const result = await inventoryCountsService.listSubmitted(query);

  return sendResponse(
    ctx,
    200,
    'Submitted month-end counts retrieved successfully',
    {
      items: result.data,
      pagination: result.pagination,
    },
  );
}

export async function bulkMonthEndCountHandler(ctx: BulkMonthEndCountContext) {
  const user = ctx.get('user')!;
  const body = ctx.req.valid('json');
  const result = await inventoryCountsService.bulkMonthEndCount(body, user.id);

  return sendResponse(ctx, 200, 'Month-end counts saved successfully', {
    counts: result.counts,
  });
}

export async function resolveScanInventoryItemHandler(
  ctx: ResolveScanInventoryItemContext,
) {
  const { id } = ctx.req.valid('param');
  const result = await inventoryCountsService.resolveScanInventoryItemId(id);

  return sendResponse(ctx, 200, 'Scan inventory item resolved successfully', {
    resolved: result,
  });
}

export async function getScanInventoryItemHandler(
  ctx: GetScanInventoryItemContext,
) {
  const { id } = ctx.req.valid('param');
  const result = await inventoryCountsService.getScanInventoryItem(id);

  return sendResponse(ctx, 200, 'Scan inventory item retrieved successfully', {
    item: result,
  });
}

export async function saveScanMonthEndCountHandler(
  ctx: SaveScanMonthEndCountContext,
) {
  const user = ctx.get('user')!;
  const { id } = ctx.req.valid('param');
  const body = ctx.req.valid('json');
  const result = await inventoryCountsService.saveScanMonthEndCount(
    id,
    body,
    user.id,
  );

  return sendResponse(ctx, 200, 'Scan count saved successfully', {
    count: result,
  });
}
