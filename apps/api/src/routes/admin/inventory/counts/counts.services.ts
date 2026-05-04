import db from '@/db';

import { and, asc, count, desc, eq, inArray, or, sql } from 'drizzle-orm';

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
  inventoryMonthEndCounts,
  inventoryTransactions,
  warehouses,
} from '@services/database/schemas';

import type { SQL } from 'drizzle-orm';
import type { InventoryItem } from '@services/database/types';
import type {
  BulkMonthEndCountInput,
  BulkMonthEndCountResultItem,
  ListMonthEndCountsInput,
} from './counts.types';

type InventoryCountWriteTx = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];
type InventoryTransaction = typeof inventoryTransactions.$inferSelect;

const DECIMAL_EPSILON = 0.000_001;

function getMonthEndDate(month: number, year: number) {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

class InventoryCountsService {
  private buildListWhereClause(params: ListMonthEndCountsInput) {
    const conditions: SQL[] = [];

    if (params.search) {
      const pattern = `%${escapeLike(params.search)}%`;

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

    if (params.brochureTypeId) {
      conditions.push(eq(brochures.brochureTypeId, params.brochureTypeId));
    }

    if (params.stockLevel) {
      conditions.push(eq(inventoryItems.stockLevel, params.stockLevel));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  private getListOrderBy(params: ListMonthEndCountsInput) {
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
                  : sortBy === 'countedBoxes'
                    ? inventoryMonthEndCounts.countedBoxes
                    : sortBy === 'distributionBoxes'
                      ? inventoryMonthEndCounts.distributionBoxes
                      : sortBy === 'updatedAt'
                        ? inventoryItems.updatedAt
                        : brochures.name;

    return params.order === 'desc'
      ? [desc(column), desc(inventoryItems.id)]
      : [asc(column), asc(inventoryItems.id)];
  }

  private getCountJoinCondition(month: number, year: number) {
    return and(
      eq(inventoryMonthEndCounts.inventoryItemId, inventoryItems.id),
      eq(inventoryMonthEndCounts.month, month),
      eq(inventoryMonthEndCounts.year, year),
    );
  }

  async list(params: ListMonthEndCountsInput) {
    const whereClause = this.buildListWhereClause(params);
    const countJoinCondition = this.getCountJoinCondition(
      params.month,
      params.year,
    );

    const [countRows, rows] = await Promise.all([
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
        .leftJoin(inventoryMonthEndCounts, countJoinCondition)
        .where(whereClause),
      db
        .select({
          inventoryItemId: inventoryItems.id,
          warehouseId: inventoryItems.warehouseId,
          warehouseName: warehouses.name,
          warehouseAcumaticaId: warehouses.acumaticaId,
          brochureId: brochures.id,
          brochureName: brochures.name,
          brochureTypeId: brochures.brochureTypeId,
          brochureTypeName: brochureTypes.name,
          customerId: brochures.customerId,
          customerName: customers.name,
          brochureImageId: brochureImages.id,
          brochureImagePackSizeId: inventoryItems.brochureImagePackSizeId,
          imageUrl: brochureImages.imageUrl,
          unitsPerBox: brochureImagePackSizes.unitsPerBox,
          stockLevel: inventoryItems.stockLevel,
          currentBoxes: inventoryItems.boxes,
          inventoryUpdatedAt: inventoryItems.updatedAt,
          countId: inventoryMonthEndCounts.id,
          countedBoxes: inventoryMonthEndCounts.countedBoxes,
          balanceBeforeBoxes: inventoryMonthEndCounts.balanceBeforeBoxes,
          distributionBoxes: inventoryMonthEndCounts.distributionBoxes,
          balanceAfterBoxes: inventoryMonthEndCounts.balanceAfterBoxes,
          distributionTransactionId:
            inventoryMonthEndCounts.distributionTransactionId,
          countedBy: inventoryMonthEndCounts.countedBy,
          countedAt: inventoryMonthEndCounts.updatedAt,
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
        .leftJoin(inventoryMonthEndCounts, countJoinCondition)
        .where(whereClause)
        .orderBy(...this.getListOrderBy(params))
        .limit(params.limit)
        .offset(getPaginationOffset(params)),
    ]);

    return createPaginatedResult({
      data: rows.map((row) => ({
        inventoryItemId: row.inventoryItemId,
        warehouseId: row.warehouseId,
        warehouseName: row.warehouseName,
        warehouseAcumaticaId: row.warehouseAcumaticaId,
        brochureId: row.brochureId,
        brochureName: row.brochureName,
        brochureTypeId: row.brochureTypeId,
        brochureTypeName: row.brochureTypeName,
        customerId: row.customerId,
        customerName: row.customerName,
        brochureImageId: row.brochureImageId,
        brochureImagePackSizeId: row.brochureImagePackSizeId,
        imageUrl: row.imageUrl,
        unitsPerBox: row.unitsPerBox,
        stockLevel: row.stockLevel,
        currentBoxes: row.currentBoxes,
        countBasisBoxes: row.balanceBeforeBoxes ?? row.currentBoxes,
        countId: row.countId,
        countedBoxes: row.countedBoxes,
        distributionBoxes: row.distributionBoxes ?? 0,
        balanceAfterBoxes: row.balanceAfterBoxes,
        distributionTransactionId: row.distributionTransactionId,
        countedBy: row.countedBy,
        countedAt: row.countedAt,
        inventoryUpdatedAt: row.inventoryUpdatedAt,
      })),
      page: params.page,
      limit: params.limit,
      total: countRows[0]?.total ?? 0,
    });
  }

  private assertCountCanReduceStock(params: {
    balanceBeforeBoxes: number;
    countedBoxes: number;
  }) {
    if (params.countedBoxes <= params.balanceBeforeBoxes + DECIMAL_EPSILON) {
      return;
    }

    throw new HttpError(
      400,
      'Month-end count cannot exceed the balance before count because Distribution can only reduce stock',
      'BAD_REQUEST',
    );
  }

  private serializeCount(count: typeof inventoryMonthEndCounts.$inferSelect) {
    return {
      id: count.id,
      inventoryItemId: count.inventoryItemId,
      month: count.month,
      year: count.year,
      countedBoxes: count.countedBoxes,
      balanceBeforeBoxes: count.balanceBeforeBoxes,
      distributionBoxes: count.distributionBoxes,
      balanceAfterBoxes: count.balanceAfterBoxes,
      distributionTransactionId: count.distributionTransactionId,
      countedBy: count.countedBy,
      createdAt: count.createdAt,
      updatedAt: count.updatedAt,
    };
  }

  private async upsertDistribution(params: {
    tx: InventoryCountWriteTx;
    item: InventoryItem;
    existingTransaction: InventoryTransaction | undefined;
    transactionDate: string;
    distributionBoxes: number;
    balanceBeforeBoxes: number;
    balanceAfterBoxes: number;
    userId: string;
  }) {
    const notes =
      params.existingTransaction?.notes ??
      `Month-end count distribution for ${params.transactionDate}`;
    const values = {
      transactionType: 'Distribution' as const,
      transactionDate: params.transactionDate,
      boxes: params.distributionBoxes,
      balanceBeforeBoxes: params.balanceBeforeBoxes,
      balanceAfterBoxes: params.balanceAfterBoxes,
      notes,
      updatedAt: new Date().toISOString(),
    };

    if (params.existingTransaction) {
      const [transaction] = await params.tx
        .update(inventoryTransactions)
        .set(values)
        .where(eq(inventoryTransactions.id, params.existingTransaction.id))
        .returning();

      if (!transaction) {
        throw new HttpError(
          500,
          'Failed to update distribution transaction',
          'INTERNAL_SERVER',
        );
      }

      return transaction;
    }

    const [transaction] = await params.tx
      .insert(inventoryTransactions)
      .values({
        inventoryItemId: params.item.id,
        ...values,
        createdBy: params.userId,
      })
      .returning();

    if (!transaction) {
      throw new HttpError(
        500,
        'Failed to record distribution transaction',
        'INTERNAL_SERVER',
      );
    }

    return transaction;
  }

  private async updateInventoryBalance(params: {
    tx: InventoryCountWriteTx;
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

  private async upsertCount(params: {
    tx: InventoryCountWriteTx;
    month: number;
    year: number;
    itemId: string;
    countedBoxes: number;
    balanceBeforeBoxes: number;
    distributionBoxes: number;
    balanceAfterBoxes: number;
    transactionId: string | null;
    userId: string;
  }) {
    const values = {
      inventoryItemId: params.itemId,
      month: params.month,
      year: params.year,
      countedBoxes: params.countedBoxes,
      balanceBeforeBoxes: params.balanceBeforeBoxes,
      distributionBoxes: params.distributionBoxes,
      balanceAfterBoxes: params.balanceAfterBoxes,
      distributionTransactionId: params.transactionId,
      countedBy: params.userId,
      updatedAt: new Date().toISOString(),
    };

    const [count] = await params.tx
      .insert(inventoryMonthEndCounts)
      .values(values)
      .onConflictDoUpdate({
        target: [
          inventoryMonthEndCounts.inventoryItemId,
          inventoryMonthEndCounts.month,
          inventoryMonthEndCounts.year,
        ],
        set: values,
      })
      .returning();

    if (!count) {
      throw new HttpError(
        500,
        'Failed to save month-end count',
        'INTERNAL_SERVER',
      );
    }

    return count;
  }

  private async processCount(params: {
    tx: InventoryCountWriteTx;
    input: BulkMonthEndCountInput['counts'][number];
    item: InventoryItem;
    existingCount: typeof inventoryMonthEndCounts.$inferSelect | undefined;
    existingTransaction: InventoryTransaction | undefined;
    month: number;
    year: number;
    transactionDate: string;
    userId: string;
  }) {
    const countedBoxes = roundDecimals(params.input.countedBoxes, 2);

    if (
      params.existingCount &&
      params.existingTransaction &&
      Math.abs(params.existingCount.countedBoxes - countedBoxes) <=
        DECIMAL_EPSILON
    ) {
      return {
        inventoryItemId: params.input.inventoryItemId,
        count: this.serializeCount(params.existingCount),
        transaction: null,
        created: false,
        updated: false,
        skipped: true,
      };
    }

    const previousDistributionBoxes = roundDecimals(
      params.existingCount?.distributionBoxes ??
        params.existingTransaction?.boxes ??
        0,
      2,
    );
    const balanceBeforeBoxes = roundDecimals(
      params.existingCount?.balanceBeforeBoxes ??
        params.existingTransaction?.balanceBeforeBoxes ??
        params.item.boxes + previousDistributionBoxes,
      2,
    );

    this.assertCountCanReduceStock({ balanceBeforeBoxes, countedBoxes });

    const distributionBoxes = roundDecimals(
      balanceBeforeBoxes - countedBoxes,
      2,
    );
    const balanceAfterBoxes = countedBoxes;
    const inventoryBalanceAfterUpdate = roundDecimals(
      params.item.boxes - (distributionBoxes - previousDistributionBoxes),
      2,
    );
    const transaction = await this.upsertDistribution({
      tx: params.tx,
      item: params.item,
      existingTransaction: params.existingTransaction,
      transactionDate: params.transactionDate,
      distributionBoxes,
      balanceBeforeBoxes,
      balanceAfterBoxes,
      userId: params.userId,
    });

    if (
      Math.abs(inventoryBalanceAfterUpdate - params.item.boxes) >
      DECIMAL_EPSILON
    ) {
      await this.updateInventoryBalance({
        tx: params.tx,
        itemId: params.item.id,
        balanceAfterBoxes: inventoryBalanceAfterUpdate,
      });
    }

    const count = await this.upsertCount({
      tx: params.tx,
      month: params.month,
      year: params.year,
      itemId: params.item.id,
      countedBoxes,
      balanceBeforeBoxes,
      distributionBoxes,
      balanceAfterBoxes,
      transactionId: transaction.id,
      userId: params.userId,
    });

    return {
      inventoryItemId: params.input.inventoryItemId,
      count: this.serializeCount(count),
      transaction,
      created: !params.existingCount,
      updated: Boolean(params.existingCount),
      skipped: false,
    };
  }

  async bulkMonthEndCount(input: BulkMonthEndCountInput, userId: string) {
    return db.transaction(async (tx) => {
      const inventoryItemIds = input.counts.map(
        (count) => count.inventoryItemId,
      );
      const transactionDate = getMonthEndDate(input.month, input.year);
      const items = await tx.query.inventoryItems.findMany({
        where: inArray(inventoryItems.id, inventoryItemIds),
      });
      const existingCounts = await tx.query.inventoryMonthEndCounts.findMany({
        where: and(
          inArray(inventoryMonthEndCounts.inventoryItemId, inventoryItemIds),
          eq(inventoryMonthEndCounts.month, input.month),
          eq(inventoryMonthEndCounts.year, input.year),
        ),
      });
      const referencedTransactionIds = existingCounts
        .map((count) => count.distributionTransactionId)
        .filter((id): id is string => Boolean(id));
      const monthlyDistributionWhere = and(
        inArray(inventoryTransactions.inventoryItemId, inventoryItemIds),
        eq(inventoryTransactions.transactionType, 'Distribution'),
        eq(inventoryTransactions.transactionDate, transactionDate),
      );
      const existingTransactions =
        await tx.query.inventoryTransactions.findMany({
          where:
            referencedTransactionIds.length > 0
              ? or(
                  monthlyDistributionWhere,
                  inArray(inventoryTransactions.id, referencedTransactionIds),
                )
              : monthlyDistributionWhere,
        });
      const itemsById = new Map(items.map((item) => [item.id, item]));
      const countsByItemId = new Map(
        existingCounts.map((count) => [count.inventoryItemId, count]),
      );
      const transactionsById = new Map(
        existingTransactions.map((transaction) => [
          transaction.id,
          transaction,
        ]),
      );
      const transactionsByItemId = new Map<string, InventoryTransaction>();
      const monthlyTransactionsByItemId = new Map<
        string,
        InventoryTransaction[]
      >();

      for (const transaction of existingTransactions) {
        if (
          transaction.transactionType !== 'Distribution' ||
          transaction.transactionDate !== transactionDate
        ) {
          continue;
        }

        const transactions =
          monthlyTransactionsByItemId.get(transaction.inventoryItemId) ?? [];
        transactions.push(transaction);
        monthlyTransactionsByItemId.set(
          transaction.inventoryItemId,
          transactions,
        );

        if (!transactionsByItemId.has(transaction.inventoryItemId)) {
          transactionsByItemId.set(transaction.inventoryItemId, transaction);
        }
      }

      for (const [itemId, transactions] of monthlyTransactionsByItemId) {
        if (transactions.length <= 1) continue;

        throw new HttpError(
          409,
          `Inventory item ${itemId} already has multiple Distribution transactions for ${input.month}/${input.year}`,
          'CONFLICT',
        );
      }

      const results: BulkMonthEndCountResultItem[] = [];

      for (const countInput of input.counts) {
        const item = itemsById.get(countInput.inventoryItemId);
        const existingCount = countsByItemId.get(countInput.inventoryItemId);
        const referencedTransaction = existingCount?.distributionTransactionId
          ? transactionsById.get(existingCount.distributionTransactionId)
          : undefined;
        const monthlyTransaction = transactionsByItemId.get(
          countInput.inventoryItemId,
        );

        if (
          referencedTransaction &&
          monthlyTransaction &&
          referencedTransaction.id !== monthlyTransaction.id
        ) {
          throw new HttpError(
            409,
            `Inventory item ${countInput.inventoryItemId} already has a different Distribution transaction for ${input.month}/${input.year}`,
            'CONFLICT',
          );
        }

        const existingTransaction = referencedTransaction ?? monthlyTransaction;

        if (!item) {
          throw new HttpError(404, 'Inventory item not found', 'NOT_FOUND');
        }

        results.push(
          await this.processCount({
            tx,
            input: countInput,
            item,
            existingCount,
            existingTransaction,
            month: input.month,
            year: input.year,
            transactionDate,
            userId,
          }),
        );
      }

      return {
        counts: results,
      };
    });
  }
}

export const inventoryCountsService = new InventoryCountsService();
