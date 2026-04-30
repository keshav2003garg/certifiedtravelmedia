import sendResponse from '@repo/server-utils/utils/response';

import { inventoryItemsService } from './items.services';

import type { CreateInventoryIntakeContext } from './items.validators';

export async function createInventoryIntakeHandler(
  ctx: CreateInventoryIntakeContext,
) {
  const user = ctx.get('user')!;
  const body = ctx.req.valid('json');
  const result = await inventoryItemsService.intake(body, user.id);

  return sendResponse(
    ctx,
    result.created ? 201 : 200,
    result.created
      ? 'Inventory item created and stock recorded'
      : 'Inventory stock updated successfully',
    {
      item: result.item,
      transaction: result.transaction,
      created: result.created,
    },
  );
}
