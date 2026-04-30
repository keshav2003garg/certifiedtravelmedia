import db from '@/db';

import { and, eq } from 'drizzle-orm';

import HttpError from '@repo/server-utils/errors/http-error';
import { roundDecimals } from '@repo/utils/number';

import {
  brochureImagePackSizes,
  inventoryItems,
  inventoryTransactions,
  warehouses,
} from '@services/database/schemas';

import type { CreateInventoryIntakeInput } from './items.types';

class InventoryItemsService {
  async intake(values: CreateInventoryIntakeInput, userId: string) {
    const [warehouse, packSize] = await Promise.all([
      db.query.warehouses.findFirst({
        where: and(
          eq(warehouses.id, values.warehouseId),
          eq(warehouses.isActive, true),
        ),
      }),
      db.query.brochureImagePackSizes.findFirst({
        where: eq(brochureImagePackSizes.id, values.brochureImagePackSizeId),
      }),
    ]);

    if (!warehouse) {
      throw new HttpError(404, 'Warehouse not found or inactive', 'NOT_FOUND');
    }

    if (!packSize) {
      throw new HttpError(404, 'Pack size not found', 'NOT_FOUND');
    }

    const boxes = roundDecimals(values.boxes);

    return db.transaction(async (tx) => {
      const existing = await tx.query.inventoryItems.findFirst({
        where: and(
          eq(inventoryItems.warehouseId, values.warehouseId),
          eq(
            inventoryItems.brochureImagePackSizeId,
            values.brochureImagePackSizeId,
          ),
        ),
      });

      const balanceBefore = existing?.boxes ?? 0;
      const balanceAfter =
        values.transactionType === 'Start Count'
          ? boxes
          : roundDecimals(balanceBefore + boxes);

      let item: typeof inventoryItems.$inferSelect;
      let created = false;

      if (existing) {
        const [updated] = await tx
          .update(inventoryItems)
          .set({
            boxes: balanceAfter,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(inventoryItems.id, existing.id))
          .returning();

        if (!updated) {
          throw new HttpError(
            500,
            'Failed to update inventory item',
            'INTERNAL_SERVER',
          );
        }

        item = updated;
      } else {
        const [inserted] = await tx
          .insert(inventoryItems)
          .values({
            warehouseId: values.warehouseId,
            brochureImagePackSizeId: values.brochureImagePackSizeId,
            boxes: balanceAfter,
          })
          .returning();

        if (!inserted) {
          throw new HttpError(
            500,
            'Failed to create inventory item',
            'INTERNAL_SERVER',
          );
        }

        item = inserted;
        created = true;
      }

      const [transaction] = await tx
        .insert(inventoryTransactions)
        .values({
          inventoryItemId: item.id,
          transactionType: values.transactionType,
          transactionDate: values.transactionDate,
          boxes,
          balanceBeforeBoxes: balanceBefore,
          balanceAfterBoxes: balanceAfter,
          createdBy: userId,
        })
        .returning();

      if (!transaction) {
        throw new HttpError(
          500,
          'Failed to record inventory transaction',
          'INTERNAL_SERVER',
        );
      }

      return { item, transaction, created };
    });
  }
}

export const inventoryItemsService = new InventoryItemsService();
