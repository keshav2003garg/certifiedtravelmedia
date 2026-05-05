import sendResponse from '@repo/server-utils/utils/response';

import { generateInventoryBulkQrLabelsPDF } from '@/utils/pdf/inventory-bulk-qr-labels-pdf';

import { inventoryItemsService } from './items.services';

import type {
  CreateInventoryIntakeContext,
  CreateInventoryItemTransactionContext,
  DownloadInventoryBulkQrLabelsContext,
  ExportInventoryItemsContext,
  GetInventoryItemContext,
  ListInventoryItemsContext,
  ListInventoryItemTransactionsContext,
} from './items.validators';

export async function listInventoryItemsHandler(
  ctx: ListInventoryItemsContext,
) {
  const query = ctx.req.valid('query');
  const result = await inventoryItemsService.list(query);

  return sendResponse(ctx, 200, 'Inventory items retrieved successfully', {
    inventoryItems: result.data,
    pagination: result.pagination,
    summary: result.summary,
  });
}

export async function getInventoryItemHandler(ctx: GetInventoryItemContext) {
  const { id } = ctx.req.valid('param');
  const item = await inventoryItemsService.getById(id);

  return sendResponse(ctx, 200, 'Inventory item retrieved successfully', {
    item,
  });
}

export async function downloadInventoryBulkQrLabelsHandler(
  ctx: DownloadInventoryBulkQrLabelsContext,
) {
  const query = ctx.req.valid('query');
  const items = await inventoryItemsService.listBulkQrLabels(query);
  const { buffer, filename } = await generateInventoryBulkQrLabelsPDF({
    items,
  });

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export async function exportInventoryItemsHandler(
  ctx: ExportInventoryItemsContext,
) {
  const query = ctx.req.valid('query');
  const csv = await inventoryItemsService.exportCSV(query);
  const generatedDate = new Date().toISOString().slice(0, 10);

  ctx.header('Content-Type', 'text/csv; charset=utf-8');
  ctx.header(
    'Content-Disposition',
    `attachment; filename="inventory-items-export-${generatedDate}.csv"`,
  );

  return ctx.body(csv);
}

export async function listInventoryItemTransactionsHandler(
  ctx: ListInventoryItemTransactionsContext,
) {
  const { id } = ctx.req.valid('param');
  const query = ctx.req.valid('query');
  const result = await inventoryItemsService.listTransactions(id, query);

  return sendResponse(
    ctx,
    200,
    'Inventory transactions retrieved successfully',
    {
      transactions: result.data,
      pagination: result.pagination,
    },
  );
}

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

export async function createInventoryItemTransactionHandler(
  ctx: CreateInventoryItemTransactionContext,
) {
  const user = ctx.get('user')!;
  const { id } = ctx.req.valid('param');
  const body = ctx.req.valid('json');
  const result = await inventoryItemsService.createTransaction(
    id,
    body,
    user.id,
  );

  return sendResponse(ctx, 201, 'Inventory transaction created successfully', {
    item: result.item,
    transaction: result.transaction,
    destinationItem: result.destinationItem,
    destinationTransaction: result.destinationTransaction,
    createdDestinationItem: result.createdDestinationItem,
  });
}
