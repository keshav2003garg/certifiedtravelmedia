import db from '@/db';

import { randomUUID } from 'node:crypto';

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  isNull,
  lte,
  or,
  sql,
} from 'drizzle-orm';

import HttpError from '@repo/server-utils/errors/http-error';
import {
  createPaginatedResult,
  getPaginationOffset,
} from '@repo/server-utils/utils/pagination';
import { roundDecimals } from '@repo/utils/number';

import {
  brochureImagePackSizes,
  brochureImages,
  brochures,
  brochureTypes,
  customers,
  inventoryItems,
  inventoryTransactions,
  userSchema,
  warehouses,
} from '@services/database/schemas';

import type { SQL } from 'drizzle-orm';
import type {
  CreateInventoryIntakeInput,
  CreateInventoryItemTransactionInput,
  DirectInventoryItemTransactionInput,
  InventoryItemDetail,
  InventoryItemRecord,
  InventoryItemTransactionInsert,
  InventoryItemTransactionResult,
  InventoryItemWriteTx,
  ListInventoryItemsParams,
  ListInventoryItemsResult,
  ListInventoryItemTransactionsParams,
  ListInventoryItemTransactionsResult,
  ResolvedIntakeCustomer,
  TransferInventoryItemTransactionInput,
} from './items.types';

class InventoryItemsService {
  private static readonly DECIMAL_EPSILON = 0.000_001;

  private escapeLike(value: string) {
    return value.replace(/[\\_%]/g, (match) => `\\${match}`);
  }

  private normalizeNullableString(value: string | undefined) {
    if (!value) return null;

    const normalized = value.trim().replace(/\s+/g, ' ');
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeUnitsPerBox(value: number) {
    return roundDecimals(value, 2);
  }

  private buildListWhereClause(params: ListInventoryItemsParams) {
    const conditions: SQL[] = [];

    if (params.search) {
      const pattern = `%${this.escapeLike(params.search)}%`;

      conditions.push(
        or(
          sql`${brochures.name} ILIKE ${pattern} ESCAPE '\\'`,
          sql`${customers.name} ILIKE ${pattern} ESCAPE '\\'`,
        )!,
      );
    }

    if (params.warehouseId) {
      conditions.push(eq(inventoryItems.warehouseId, params.warehouseId));
    }

    if (params.brochureId) {
      conditions.push(eq(brochures.id, params.brochureId));
    }

    if (params.brochureTypeId) {
      conditions.push(eq(brochures.brochureTypeId, params.brochureTypeId));
    }

    if (params.stockLevel) {
      conditions.push(eq(inventoryItems.stockLevel, params.stockLevel));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  private getListOrderBy(params: ListInventoryItemsParams) {
    const sortBy = params.sortBy ?? 'brochureName';
    const column =
      sortBy === 'warehouseName'
        ? warehouses.name
        : sortBy === 'brochureTypeName'
          ? brochureTypes.name
          : sortBy === 'customerName'
            ? customers.name
            : sortBy === 'boxes'
              ? inventoryItems.boxes
              : sortBy === 'unitsPerBox'
                ? brochureImagePackSizes.unitsPerBox
                : sortBy === 'stockLevel'
                  ? inventoryItems.stockLevel
                  : sortBy === 'createdAt'
                    ? inventoryItems.createdAt
                    : sortBy === 'updatedAt'
                      ? inventoryItems.updatedAt
                      : brochures.name;

    return params.order === 'desc'
      ? [desc(column), desc(inventoryItems.id)]
      : [asc(column), asc(inventoryItems.id)];
  }

  async list(
    params: ListInventoryItemsParams,
  ): Promise<ListInventoryItemsResult> {
    const whereClause = this.buildListWhereClause(params);

    const [countRows, summaryRows, rows] = await Promise.all([
      db
        .select({ total: count(inventoryItems.id) })
        .from(inventoryItems)
        .innerJoin(warehouses, eq(inventoryItems.warehouseId, warehouses.id))
        .innerJoin(
          brochureImagePackSizes,
          eq(inventoryItems.brochureImagePackSizeId, brochureImagePackSizes.id),
        )
        .innerJoin(
          brochureImages,
          eq(brochureImagePackSizes.brochureImageId, brochureImages.id),
        )
        .innerJoin(brochures, eq(brochureImages.brochureId, brochures.id))
        .innerJoin(
          brochureTypes,
          eq(brochures.brochureTypeId, brochureTypes.id),
        )
        .leftJoin(customers, eq(brochures.customerId, customers.id))
        .where(whereClause),
      db
        .select({
          totalBoxes: sql<number>`coalesce(sum(${inventoryItems.boxes}), 0)`,
          warehouses: sql<number>`count(distinct ${inventoryItems.warehouseId})`,
        })
        .from(inventoryItems)
        .innerJoin(warehouses, eq(inventoryItems.warehouseId, warehouses.id))
        .innerJoin(
          brochureImagePackSizes,
          eq(inventoryItems.brochureImagePackSizeId, brochureImagePackSizes.id),
        )
        .innerJoin(
          brochureImages,
          eq(brochureImagePackSizes.brochureImageId, brochureImages.id),
        )
        .innerJoin(brochures, eq(brochureImages.brochureId, brochures.id))
        .innerJoin(
          brochureTypes,
          eq(brochures.brochureTypeId, brochureTypes.id),
        )
        .leftJoin(customers, eq(brochures.customerId, customers.id))
        .where(whereClause),
      db
        .select({
          id: inventoryItems.id,
          warehouseId: inventoryItems.warehouseId,
          brochureImagePackSizeId: inventoryItems.brochureImagePackSizeId,
          boxes: inventoryItems.boxes,
          stockLevel: inventoryItems.stockLevel,
          qrCodeUrl: inventoryItems.qrCodeUrl,
          createdAt: inventoryItems.createdAt,
          updatedAt: inventoryItems.updatedAt,
          warehouseName: warehouses.name,
          warehouseAcumaticaId: warehouses.acumaticaId,
          brochureId: brochures.id,
          brochureName: brochures.name,
          brochureTypeId: brochures.brochureTypeId,
          brochureTypeName: brochureTypes.name,
          customerId: brochures.customerId,
          customerName: customers.name,
          brochureImageId: brochureImages.id,
          imageUrl: brochureImages.imageUrl,
          unitsPerBox: brochureImagePackSizes.unitsPerBox,
        })
        .from(inventoryItems)
        .innerJoin(warehouses, eq(inventoryItems.warehouseId, warehouses.id))
        .innerJoin(
          brochureImagePackSizes,
          eq(inventoryItems.brochureImagePackSizeId, brochureImagePackSizes.id),
        )
        .innerJoin(
          brochureImages,
          eq(brochureImagePackSizes.brochureImageId, brochureImages.id),
        )
        .innerJoin(brochures, eq(brochureImages.brochureId, brochures.id))
        .innerJoin(
          brochureTypes,
          eq(brochures.brochureTypeId, brochureTypes.id),
        )
        .leftJoin(customers, eq(brochures.customerId, customers.id))
        .where(whereClause)
        .orderBy(...this.getListOrderBy(params))
        .limit(params.limit)
        .offset(getPaginationOffset(params)),
    ]);
    const totalItems = countRows[0]?.total ?? 0;
    const summary = summaryRows[0];

    return {
      ...createPaginatedResult({
        data: rows,
        page: params.page,
        limit: params.limit,
        total: totalItems,
      }),
      summary: {
        totalItems,
        totalBoxes: Number(summary?.totalBoxes ?? 0),
        warehouses: Number(summary?.warehouses ?? 0),
      },
    };
  }

  async getById(id: string): Promise<InventoryItemDetail> {
    const [item] = await db
      .select({
        id: inventoryItems.id,
        warehouseId: inventoryItems.warehouseId,
        brochureImagePackSizeId: inventoryItems.brochureImagePackSizeId,
        boxes: inventoryItems.boxes,
        stockLevel: inventoryItems.stockLevel,
        qrCodeUrl: inventoryItems.qrCodeUrl,
        createdAt: inventoryItems.createdAt,
        updatedAt: inventoryItems.updatedAt,
        warehouseName: warehouses.name,
        warehouseAcumaticaId: warehouses.acumaticaId,
        warehouseAddress: warehouses.address,
        brochureId: brochures.id,
        brochureName: brochures.name,
        brochureTypeId: brochures.brochureTypeId,
        brochureTypeName: brochureTypes.name,
        customerId: brochures.customerId,
        customerName: customers.name,
        brochureCreatedAt: brochures.createdAt,
        brochureUpdatedAt: brochures.updatedAt,
        brochureImageId: brochureImages.id,
        imageUrl: brochureImages.imageUrl,
        brochureImageCreatedAt: brochureImages.createdAt,
        brochureImageUpdatedAt: brochureImages.updatedAt,
        unitsPerBox: brochureImagePackSizes.unitsPerBox,
        packSizeCreatedAt: brochureImagePackSizes.createdAt,
        packSizeUpdatedAt: brochureImagePackSizes.updatedAt,
      })
      .from(inventoryItems)
      .innerJoin(warehouses, eq(inventoryItems.warehouseId, warehouses.id))
      .innerJoin(
        brochureImagePackSizes,
        eq(inventoryItems.brochureImagePackSizeId, brochureImagePackSizes.id),
      )
      .innerJoin(
        brochureImages,
        eq(brochureImagePackSizes.brochureImageId, brochureImages.id),
      )
      .innerJoin(brochures, eq(brochureImages.brochureId, brochures.id))
      .innerJoin(brochureTypes, eq(brochures.brochureTypeId, brochureTypes.id))
      .leftJoin(customers, eq(brochures.customerId, customers.id))
      .where(eq(inventoryItems.id, id))
      .limit(1);

    if (!item) {
      throw new HttpError(404, 'Inventory item not found', 'NOT_FOUND');
    }

    return item;
  }

  private buildTransactionWhereClause(
    itemId: string,
    params: ListInventoryItemTransactionsParams,
  ) {
    const conditions: SQL[] = [
      eq(inventoryTransactions.inventoryItemId, itemId),
    ];

    if (params.transactionType) {
      conditions.push(
        eq(inventoryTransactions.transactionType, params.transactionType),
      );
    }

    if (params.dateFrom) {
      conditions.push(
        gte(inventoryTransactions.transactionDate, params.dateFrom),
      );
    }

    if (params.dateTo) {
      conditions.push(
        lte(inventoryTransactions.transactionDate, params.dateTo),
      );
    }

    return and(...conditions);
  }

  async listTransactions(
    itemId: string,
    params: ListInventoryItemTransactionsParams,
  ): Promise<ListInventoryItemTransactionsResult> {
    const item = await db.query.inventoryItems.findFirst({
      columns: { id: true },
      where: eq(inventoryItems.id, itemId),
    });

    if (!item) {
      throw new HttpError(404, 'Inventory item not found', 'NOT_FOUND');
    }

    const whereClause = this.buildTransactionWhereClause(itemId, params);

    const [countRows, rows] = await Promise.all([
      db
        .select({ total: count(inventoryTransactions.id) })
        .from(inventoryTransactions)
        .where(whereClause),
      db
        .select({
          id: inventoryTransactions.id,
          inventoryItemId: inventoryTransactions.inventoryItemId,
          transactionType: inventoryTransactions.transactionType,
          transactionDate: inventoryTransactions.transactionDate,
          boxes: inventoryTransactions.boxes,
          balanceBeforeBoxes: inventoryTransactions.balanceBeforeBoxes,
          balanceAfterBoxes: inventoryTransactions.balanceAfterBoxes,
          requestId: inventoryTransactions.requestId,
          transferGroupId: inventoryTransactions.transferGroupId,
          sourceWarehouseId: inventoryTransactions.sourceWarehouseId,
          destinationWarehouseId: inventoryTransactions.destinationWarehouseId,
          notes: inventoryTransactions.notes,
          createdBy: inventoryTransactions.createdBy,
          createdByName: userSchema.name,
          createdByEmail: userSchema.email,
          createdAt: inventoryTransactions.createdAt,
          updatedAt: inventoryTransactions.updatedAt,
        })
        .from(inventoryTransactions)
        .leftJoin(
          userSchema,
          eq(inventoryTransactions.createdBy, userSchema.id),
        )
        .where(whereClause)
        .orderBy(
          desc(inventoryTransactions.transactionDate),
          desc(inventoryTransactions.createdAt),
          desc(inventoryTransactions.id),
        )
        .limit(params.limit)
        .offset(getPaginationOffset(params)),
    ]);

    return createPaginatedResult({
      data: rows,
      page: params.page,
      limit: params.limit,
      total: countRows[0]?.total ?? 0,
    });
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

  private async getInventoryItemRecord(
    tx: InventoryItemWriteTx,
    itemId: string,
  ) {
    const item = await tx.query.inventoryItems.findFirst({
      where: eq(inventoryItems.id, itemId),
    });

    if (!item) {
      throw new HttpError(404, 'Inventory item not found', 'NOT_FOUND');
    }

    return item;
  }

  private async assertActiveDestinationWarehouse(
    tx: InventoryItemWriteTx,
    warehouseId: string,
  ) {
    const warehouse = await tx.query.warehouses.findFirst({
      columns: { id: true },
      where: and(eq(warehouses.id, warehouseId), eq(warehouses.isActive, true)),
    });

    if (!warehouse) {
      throw new HttpError(404, 'Destination warehouse not found', 'NOT_FOUND');
    }
  }

  private assertCanReduceStock(params: {
    balanceBeforeBoxes: number;
    boxes: number;
    action: string;
  }) {
    if (
      params.boxes <=
      params.balanceBeforeBoxes + InventoryItemsService.DECIMAL_EPSILON
    ) {
      return;
    }

    throw new HttpError(
      400,
      `${params.action} boxes cannot exceed the current inventory balance`,
      'BAD_REQUEST',
    );
  }

  private async updateInventoryBalance(params: {
    tx: InventoryItemWriteTx;
    itemId: string;
    balanceAfterBoxes: number;
  }) {
    const [item] = await params.tx
      .update(inventoryItems)
      .set({
        boxes: params.balanceAfterBoxes,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(inventoryItems.id, params.itemId))
      .returning();

    if (!item) {
      throw new HttpError(
        500,
        'Failed to update inventory balance',
        'INTERNAL_SERVER',
      );
    }

    return item;
  }

  private async recordDetailTransaction(params: {
    tx: InventoryItemWriteTx;
    itemId: string;
    transactionType: InventoryItemTransactionInsert['transactionType'];
    transactionDate: string;
    boxes: number;
    balanceBeforeBoxes: number;
    balanceAfterBoxes: number;
    userId: string;
    notes?: string;
    transferGroupId?: string;
    sourceWarehouseId?: string;
    destinationWarehouseId?: string;
  }) {
    const [transaction] = await params.tx
      .insert(inventoryTransactions)
      .values({
        inventoryItemId: params.itemId,
        transactionType: params.transactionType,
        transactionDate: params.transactionDate,
        boxes: params.boxes,
        balanceBeforeBoxes: params.balanceBeforeBoxes,
        balanceAfterBoxes: params.balanceAfterBoxes,
        transferGroupId: params.transferGroupId,
        sourceWarehouseId: params.sourceWarehouseId,
        destinationWarehouseId: params.destinationWarehouseId,
        notes: this.normalizeNullableString(params.notes),
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

  private async createDirectTransaction(params: {
    tx: InventoryItemWriteTx;
    item: InventoryItemRecord;
    values: DirectInventoryItemTransactionInput;
    boxes: number;
    userId: string;
  }): Promise<InventoryItemTransactionResult> {
    const balanceBefore = params.item.boxes;
    const isAddition =
      params.values.transactionType === 'Adjustment' &&
      params.values.adjustmentDirection === 'Addition';

    if (!isAddition) {
      this.assertCanReduceStock({
        balanceBeforeBoxes: balanceBefore,
        boxes: params.boxes,
        action: params.values.transactionType,
      });
    }

    const balanceAfter = roundDecimals(
      isAddition ? balanceBefore + params.boxes : balanceBefore - params.boxes,
    );
    const item = await this.updateInventoryBalance({
      tx: params.tx,
      itemId: params.item.id,
      balanceAfterBoxes: balanceAfter,
    });
    const transaction = await this.recordDetailTransaction({
      tx: params.tx,
      itemId: params.item.id,
      transactionType: params.values.transactionType,
      transactionDate: params.values.transactionDate,
      boxes: params.boxes,
      balanceBeforeBoxes: balanceBefore,
      balanceAfterBoxes: balanceAfter,
      notes: params.values.notes,
      userId: params.userId,
    });

    return { item, transaction };
  }

  private async upsertTransferDestination(params: {
    tx: InventoryItemWriteTx;
    sourceItem: InventoryItemRecord;
    destinationWarehouseId: string;
    boxes: number;
  }) {
    const existing = await params.tx.query.inventoryItems.findFirst({
      where: and(
        eq(inventoryItems.warehouseId, params.destinationWarehouseId),
        eq(
          inventoryItems.brochureImagePackSizeId,
          params.sourceItem.brochureImagePackSizeId,
        ),
      ),
    });

    const balanceBefore = existing?.boxes ?? 0;
    const balanceAfter = roundDecimals(balanceBefore + params.boxes);

    if (existing) {
      const item = await this.updateInventoryBalance({
        tx: params.tx,
        itemId: existing.id,
        balanceAfterBoxes: balanceAfter,
      });

      return { item, balanceBefore, balanceAfter, created: false };
    }

    const [item] = await params.tx
      .insert(inventoryItems)
      .values({
        warehouseId: params.destinationWarehouseId,
        brochureImagePackSizeId: params.sourceItem.brochureImagePackSizeId,
        boxes: balanceAfter,
        stockLevel: 'On Target',
      })
      .returning();

    if (!item) {
      throw new HttpError(
        500,
        'Failed to create destination inventory item',
        'INTERNAL_SERVER',
      );
    }

    return { item, balanceBefore, balanceAfter, created: true };
  }

  private async createTransferTransaction(params: {
    tx: InventoryItemWriteTx;
    sourceItem: InventoryItemRecord;
    values: TransferInventoryItemTransactionInput;
    boxes: number;
    userId: string;
  }): Promise<InventoryItemTransactionResult> {
    if (
      params.values.destinationWarehouseId === params.sourceItem.warehouseId
    ) {
      throw new HttpError(
        400,
        'Destination warehouse must be different from the current warehouse',
        'BAD_REQUEST',
      );
    }

    await this.assertActiveDestinationWarehouse(
      params.tx,
      params.values.destinationWarehouseId,
    );

    const sourceBalanceBefore = params.sourceItem.boxes;
    this.assertCanReduceStock({
      balanceBeforeBoxes: sourceBalanceBefore,
      boxes: params.boxes,
      action: 'Transfer',
    });

    const sourceBalanceAfter = roundDecimals(
      sourceBalanceBefore - params.boxes,
    );
    const sourceItem = await this.updateInventoryBalance({
      tx: params.tx,
      itemId: params.sourceItem.id,
      balanceAfterBoxes: sourceBalanceAfter,
    });
    const destination = await this.upsertTransferDestination({
      tx: params.tx,
      sourceItem: params.sourceItem,
      destinationWarehouseId: params.values.destinationWarehouseId,
      boxes: params.boxes,
    });
    const transferGroupId = randomUUID();
    const [sourceTransaction, destinationTransaction] = await Promise.all([
      this.recordDetailTransaction({
        tx: params.tx,
        itemId: params.sourceItem.id,
        transactionType: 'Trans Out',
        transactionDate: params.values.transactionDate,
        boxes: params.boxes,
        balanceBeforeBoxes: sourceBalanceBefore,
        balanceAfterBoxes: sourceBalanceAfter,
        transferGroupId,
        sourceWarehouseId: params.sourceItem.warehouseId,
        destinationWarehouseId: params.values.destinationWarehouseId,
        notes: params.values.notes,
        userId: params.userId,
      }),
      this.recordDetailTransaction({
        tx: params.tx,
        itemId: destination.item.id,
        transactionType: 'Trans In',
        transactionDate: params.values.transactionDate,
        boxes: params.boxes,
        balanceBeforeBoxes: destination.balanceBefore,
        balanceAfterBoxes: destination.balanceAfter,
        transferGroupId,
        sourceWarehouseId: params.sourceItem.warehouseId,
        destinationWarehouseId: params.values.destinationWarehouseId,
        notes: params.values.notes,
        userId: params.userId,
      }),
    ]);

    return {
      item: sourceItem,
      transaction: sourceTransaction,
      destinationItem: destination.item,
      destinationTransaction,
      createdDestinationItem: destination.created,
    };
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

  async createTransaction(
    itemId: string,
    values: CreateInventoryItemTransactionInput,
    userId: string,
  ): Promise<InventoryItemTransactionResult> {
    return db.transaction(async (tx) => {
      const item = await this.getInventoryItemRecord(tx, itemId);
      const boxes = roundDecimals(values.boxes);

      if (values.transactionType === 'Transfer') {
        return this.createTransferTransaction({
          tx,
          sourceItem: item,
          values,
          boxes,
          userId,
        });
      }

      return this.createDirectTransaction({
        tx,
        item,
        values,
        boxes,
        userId,
      });
    });
  }
}

export const inventoryItemsService = new InventoryItemsService();
