import db from '@/db';

import { and, eq, isNull, or, sql } from 'drizzle-orm';

import HttpError from '@repo/server-utils/errors/http-error';
import { roundDecimals } from '@repo/utils/number';

import {
  brochureImagePackSizes,
  brochureImages,
  brochures,
  brochureTypes,
  customers,
  inventoryItems,
  inventoryTransactions,
  warehouses,
} from '@services/database/schemas';

import type { CreateInventoryIntakeInput } from './items.types';

type InventoryItemWriteTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

interface ResolvedIntakeCustomer {
  id: string | null;
  name: string | null;
}

class InventoryItemsService {
  private normalizeNullableString(value: string | undefined) {
    if (!value) return null;

    const normalized = value.trim().replace(/\s+/g, ' ');
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeUnitsPerBox(value: number) {
    return roundDecimals(value, 2);
  }

  private async assertIntakeReferences(
    tx: InventoryItemWriteTx,
    values: CreateInventoryIntakeInput,
  ) {
    const [warehouse, brochureType] = await Promise.all([
      tx.query.warehouses.findFirst({
        where: and(
          eq(warehouses.id, values.warehouseId),
          eq(warehouses.isActive, true),
        ),
      }),
      tx.query.brochureTypes.findFirst({
        where: eq(brochureTypes.id, values.brochureTypeId),
      }),
    ]);

    if (!warehouse) {
      throw new HttpError(404, 'Warehouse not found or inactive', 'NOT_FOUND');
    }

    if (!brochureType) {
      throw new HttpError(404, 'Brochure type not found', 'NOT_FOUND');
    }
  }

  private async resolveIntakeCustomer(
    tx: InventoryItemWriteTx,
    values: CreateInventoryIntakeInput,
  ): Promise<ResolvedIntakeCustomer> {
    if (values.customerId) {
      const customer = await tx.query.customers.findFirst({
        where: eq(customers.id, values.customerId),
      });

      if (!customer) {
        throw new HttpError(404, 'Acumatica customer not found', 'NOT_FOUND');
      }

      return { id: customer.id, name: customer.name };
    }

    const customerName = this.normalizeNullableString(values.customerName);

    if (!customerName) {
      return { id: null, name: null };
    }

    const lookupValue = customerName.toLowerCase();
    const customer = await tx.query.customers.findFirst({
      where: or(
        sql`LOWER(${customers.name}) = ${lookupValue}`,
        sql`LOWER(${customers.acumaticaId}) = ${lookupValue}`,
      ),
    });

    return {
      id: customer?.id ?? null,
      name: customer?.name ?? customerName,
    };
  }

  private async findOrCreateBrochure(params: {
    tx: InventoryItemWriteTx;
    values: CreateInventoryIntakeInput;
    customerId: string | null;
    userId: string;
  }) {
    const customerCondition = params.customerId
      ? eq(brochures.customerId, params.customerId)
      : isNull(brochures.customerId);

    const existing = await params.tx.query.brochures.findFirst({
      where: and(
        sql`LOWER(${brochures.name}) = ${params.values.brochureName.toLowerCase()}`,
        eq(brochures.brochureTypeId, params.values.brochureTypeId),
        customerCondition,
      ),
    });

    if (existing) return existing;

    const [created] = await params.tx
      .insert(brochures)
      .values({
        name: params.values.brochureName,
        brochureTypeId: params.values.brochureTypeId,
        customerId: params.customerId,
        createdBy: params.userId,
      })
      .returning();

    if (!created) {
      throw new HttpError(500, 'Failed to create brochure', 'INTERNAL_SERVER');
    }

    return created;
  }

  private async findOrCreateBrochureImage(params: {
    tx: InventoryItemWriteTx;
    brochureId: string;
    imageUrl: string | undefined;
    userId: string;
  }) {
    const imageCondition = params.imageUrl
      ? eq(brochureImages.imageUrl, params.imageUrl)
      : isNull(brochureImages.imageUrl);

    const existing = await params.tx.query.brochureImages.findFirst({
      where: and(
        eq(brochureImages.brochureId, params.brochureId),
        imageCondition,
      ),
    });

    if (existing) return existing;

    const [sortOrderRow] = await params.tx
      .select({
        nextSortOrder:
          sql<number>`COALESCE(MAX(${brochureImages.sortOrder}), -1) + 1`.mapWith(
            Number,
          ),
      })
      .from(brochureImages)
      .where(eq(brochureImages.brochureId, params.brochureId));

    const [created] = await params.tx
      .insert(brochureImages)
      .values({
        brochureId: params.brochureId,
        imageUrl: params.imageUrl ?? null,
        sortOrder: sortOrderRow?.nextSortOrder ?? 0,
        uploadedBy: params.userId,
      })
      .returning();

    if (!created) {
      throw new HttpError(
        500,
        'Failed to create brochure image',
        'INTERNAL_SERVER',
      );
    }

    return created;
  }

  private async findOrCreatePackSize(params: {
    tx: InventoryItemWriteTx;
    imageId: string;
    unitsPerBox: number;
    userId: string;
  }) {
    const unitsPerBox = this.normalizeUnitsPerBox(params.unitsPerBox);
    const existing = await params.tx.query.brochureImagePackSizes.findFirst({
      where: and(
        eq(brochureImagePackSizes.brochureImageId, params.imageId),
        eq(brochureImagePackSizes.unitsPerBox, unitsPerBox),
      ),
    });

    if (existing) return existing;

    const [created] = await params.tx
      .insert(brochureImagePackSizes)
      .values({
        brochureImageId: params.imageId,
        unitsPerBox,
        createdBy: params.userId,
      })
      .returning();

    if (!created) {
      throw new HttpError(
        500,
        'Failed to create image pack size',
        'INTERNAL_SERVER',
      );
    }

    return created;
  }

  private async upsertInventoryItem(params: {
    tx: InventoryItemWriteTx;
    warehouseId: string;
    brochureImagePackSizeId: string;
    boxes: number;
    transactionType: CreateInventoryIntakeInput['transactionType'];
  }) {
    const existing = await params.tx.query.inventoryItems.findFirst({
      where: and(
        eq(inventoryItems.warehouseId, params.warehouseId),
        eq(
          inventoryItems.brochureImagePackSizeId,
          params.brochureImagePackSizeId,
        ),
      ),
    });

    const balanceBefore = existing?.boxes ?? 0;
    const balanceAfter =
      params.transactionType === 'Start Count'
        ? params.boxes
        : roundDecimals(balanceBefore + params.boxes);

    if (existing) {
      const [item] = await params.tx
        .update(inventoryItems)
        .set({
          boxes: balanceAfter,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(inventoryItems.id, existing.id))
        .returning();

      if (!item) {
        throw new HttpError(
          500,
          'Failed to update inventory item',
          'INTERNAL_SERVER',
        );
      }

      return { item, balanceBefore, balanceAfter, created: false };
    }

    const [item] = await params.tx
      .insert(inventoryItems)
      .values({
        warehouseId: params.warehouseId,
        brochureImagePackSizeId: params.brochureImagePackSizeId,
        boxes: balanceAfter,
        stockLevel: 'On Target',
      })
      .returning();

    if (!item) {
      throw new HttpError(
        500,
        'Failed to create inventory item',
        'INTERNAL_SERVER',
      );
    }

    return { item, balanceBefore, balanceAfter, created: true };
  }

  private async recordIntakeTransaction(params: {
    tx: InventoryItemWriteTx;
    itemId: string;
    values: CreateInventoryIntakeInput;
    boxes: number;
    balanceBefore: number;
    balanceAfter: number;
    userId: string;
  }) {
    const [transaction] = await params.tx
      .insert(inventoryTransactions)
      .values({
        inventoryItemId: params.itemId,
        transactionType: params.values.transactionType,
        transactionDate: params.values.transactionDate,
        boxes: params.boxes,
        balanceBeforeBoxes: params.balanceBefore,
        balanceAfterBoxes: params.balanceAfter,
        notes: this.normalizeNullableString(params.values.notes),
        createdBy: params.userId,
      })
      .returning();

    if (!transaction) {
      throw new HttpError(
        500,
        'Failed to record inventory transaction',
        'INTERNAL_SERVER',
      );
    }

    return transaction;
  }

  async intake(values: CreateInventoryIntakeInput, userId: string) {
    return db.transaction(async (tx) => {
      await this.assertIntakeReferences(tx, values);

      const customer = await this.resolveIntakeCustomer(tx, values);
      const brochure = await this.findOrCreateBrochure({
        tx,
        values,
        customerId: customer.id,
        userId,
      });
      const image = await this.findOrCreateBrochureImage({
        tx,
        brochureId: brochure.id,
        imageUrl: values.imageUrl,
        userId,
      });
      const packSize = await this.findOrCreatePackSize({
        tx,
        imageId: image.id,
        unitsPerBox: values.unitsPerBox,
        userId,
      });
      const boxes = roundDecimals(values.boxes);
      const inventoryResult = await this.upsertInventoryItem({
        tx,
        warehouseId: values.warehouseId,
        brochureImagePackSizeId: packSize.id,
        boxes,
        transactionType: values.transactionType,
      });
      const transaction = await this.recordIntakeTransaction({
        tx,
        itemId: inventoryResult.item.id,
        values,
        boxes,
        balanceBefore: inventoryResult.balanceBefore,
        balanceAfter: inventoryResult.balanceAfter,
        userId,
      });

      return {
        item: inventoryResult.item,
        transaction,
        created: inventoryResult.created,
        brochure,
        image,
        packSize,
      };
    });
  }
}

export const inventoryItemsService = new InventoryItemsService();
