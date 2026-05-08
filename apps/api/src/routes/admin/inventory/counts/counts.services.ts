import db from '@/db';

import { and, asc, count, eq, gte, inArray, lte, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

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
  SavedMonthEndCount,
} from './counts.types';

type InventoryCountWriteTx = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];
type InventoryTransaction = typeof inventoryTransactions.$inferSelect;

const DECIMAL_EPSILON = 0.000_001;

function getMonthStartDate(month: number, year: number) {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

function getMonthEndDate(month: number, year: number) {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

function getPreviousPeriod(month: number, year: number) {
  if (month === 1) {
    return { month: 12, year: year - 1 };
  }

  return { month: month - 1, year };
}

function getPeriodFromDate(date: string) {
  return {
    month: Number(date.slice(5, 7)),
    year: Number(date.slice(0, 4)),
  };
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

function normalizeNullableNumber(value: number | string | null | undefined) {
  return value === null || value === undefined ? null : Number(value);
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

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  private getListOrderBy() {
    return [asc(brochures.name), asc(warehouses.name), asc(inventoryItems.id)];
  }

  private buildMonthlyTransactionSummarySubquery(month: number, year: number) {
    const startDate = getMonthStartDate(month, year);
    const endDate = getMonthEndDate(month, year);

    return db
      .select({
        inventoryItemId: inventoryTransactions.inventoryItemId,
        transactionBoxes:
          sql<number>`coalesce(sum(case when ${inventoryTransactions.transactionType} <> 'Distribution' then ${inventoryTransactions.balanceAfterBoxes} - ${inventoryTransactions.balanceBeforeBoxes} else 0 end), 0)`
            .mapWith(Number)
            .as('transactionBoxes'),
        distributionBoxes: sql<
          number | null
        >`case when count(*) filter (where ${inventoryTransactions.transactionType} = 'Distribution') = 0 then null else coalesce(sum(case when ${inventoryTransactions.transactionType} = 'Distribution' then ${inventoryTransactions.boxes} else 0 end), 0) end`.as(
          'distributionBoxes',
        ),
      })
      .from(inventoryTransactions)
      .where(
        and(
          gte(inventoryTransactions.transactionDate, startDate),
          lte(inventoryTransactions.transactionDate, endDate),
        ),
      )
      .groupBy(inventoryTransactions.inventoryItemId)
      .as('monthly_transaction_summary');
  }

  private buildPreviousTransactionBalanceSubquery(endDate: string) {
    return db
      .select({
        inventoryItemId: inventoryTransactions.inventoryItemId,
        endCount:
          sql<number>`(array_agg(${inventoryTransactions.balanceAfterBoxes} order by ${inventoryTransactions.transactionDate} desc, ${inventoryTransactions.createdAt} desc, ${inventoryTransactions.id} desc))[1]`
            .mapWith(Number)
            .as('endCount'),
      })
      .from(inventoryTransactions)
      .where(lte(inventoryTransactions.transactionDate, endDate))
      .groupBy(inventoryTransactions.inventoryItemId)
      .as('previous_transaction_balance');
  }

  async list(params: ListMonthEndCountsInput) {
    const whereClause = this.buildListWhereClause(params);
    const previousPeriod = getPreviousPeriod(params.month, params.year);
    const previousEndDate = getMonthEndDate(
      previousPeriod.month,
      previousPeriod.year,
    );
    const currentCounts = alias(inventoryMonthEndCounts, 'current_counts');
    const previousCounts = alias(inventoryMonthEndCounts, 'previous_counts');
    const monthlySummary = this.buildMonthlyTransactionSummarySubquery(
      params.month,
      params.year,
    );
    const previousTransactionBalance =
      this.buildPreviousTransactionBalanceSubquery(previousEndDate);

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
          brochureImageId: brochureImages.id,
          brochureImagePackSizeId: inventoryItems.brochureImagePackSizeId,
          imageUrl: brochureImages.imageUrl,
          unitsPerBox: brochureImagePackSizes.unitsPerBox,
          countId: currentCounts.id,
          endCount: currentCounts.endCount,
          previousStoredEndCount: previousCounts.endCount,
          previousComputedEndCount: previousTransactionBalance.endCount,
          transactionBoxes: monthlySummary.transactionBoxes,
          distributionBoxes: monthlySummary.distributionBoxes,
          inventoryUpdatedAt: inventoryItems.updatedAt,
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
        .leftJoin(
          currentCounts,
          and(
            eq(currentCounts.inventoryItemId, inventoryItems.id),
            eq(currentCounts.month, params.month),
            eq(currentCounts.year, params.year),
          ),
        )
        .leftJoin(
          previousCounts,
          and(
            eq(previousCounts.inventoryItemId, inventoryItems.id),
            eq(previousCounts.month, previousPeriod.month),
            eq(previousCounts.year, previousPeriod.year),
          ),
        )
        .leftJoin(
          previousTransactionBalance,
          eq(previousTransactionBalance.inventoryItemId, inventoryItems.id),
        )
        .leftJoin(
          monthlySummary,
          eq(monthlySummary.inventoryItemId, inventoryItems.id),
        )
        .where(whereClause)
        .orderBy(...this.getListOrderBy())
        .limit(params.limit)
        .offset(getPaginationOffset(params)),
    ]);

    return createPaginatedResult({
      data: rows.map((row) => {
        const previousMonthEndCount = roundDecimals(
          normalizeNullableNumber(row.previousStoredEndCount) ??
            normalizeNullableNumber(row.previousComputedEndCount) ??
            0,
          2,
        );
        const transactionBoxes = roundDecimals(
          normalizeNullableNumber(row.transactionBoxes) ?? 0,
          2,
        );
        const distributionBoxes = normalizeNullableNumber(
          row.distributionBoxes,
        );
        const endCount = normalizeNullableNumber(row.endCount);

        return {
          inventoryItemId: row.inventoryItemId,
          warehouseId: row.warehouseId,
          warehouseName: row.warehouseName,
          warehouseAcumaticaId: row.warehouseAcumaticaId,
          brochureId: row.brochureId,
          brochureName: row.brochureName,
          brochureTypeId: row.brochureTypeId,
          brochureTypeName: row.brochureTypeName,
          brochureImageId: row.brochureImageId,
          brochureImagePackSizeId: row.brochureImagePackSizeId,
          imageUrl: row.imageUrl,
          unitsPerBox: row.unitsPerBox,
          countId: row.countId,
          previousMonthEndCount,
          transactionBoxes,
          distributionBoxes:
            distributionBoxes === null
              ? null
              : roundDecimals(distributionBoxes, 2),
          endCount: endCount === null ? null : roundDecimals(endCount, 2),
          inventoryUpdatedAt: row.inventoryUpdatedAt,
        };
      }),
      page: params.page,
      limit: params.limit,
      total: countRows[0]?.total ?? 0,
    });
  }

  private serializeCount(
    count: typeof inventoryMonthEndCounts.$inferSelect,
  ): SavedMonthEndCount {
    return {
      id: count.id,
      inventoryItemId: count.inventoryItemId,
      month: count.month,
      year: count.year,
      endCount: count.endCount,
      createdAt: count.createdAt,
      updatedAt: count.updatedAt,
    };
  }

  private async getClosingBalanceForPeriod(params: {
    tx: InventoryCountWriteTx;
    inventoryItemId: string;
    month: number;
    year: number;
  }) {
    const endDate = getMonthEndDate(params.month, params.year);
    const [row] = await params.tx
      .select({
        endCount:
          sql<number>`(array_agg(${inventoryTransactions.balanceAfterBoxes} order by ${inventoryTransactions.transactionDate} desc, ${inventoryTransactions.createdAt} desc, ${inventoryTransactions.id} desc))[1]`.mapWith(
            Number,
          ),
      })
      .from(inventoryTransactions)
      .where(
        and(
          eq(inventoryTransactions.inventoryItemId, params.inventoryItemId),
          lte(inventoryTransactions.transactionDate, endDate),
        ),
      )
      .groupBy(inventoryTransactions.inventoryItemId);

    return roundDecimals(row?.endCount ?? 0, 2);
  }

  private async upsertCount(params: {
    tx: InventoryCountWriteTx;
    month: number;
    year: number;
    inventoryItemId: string;
    endCount: number;
  }) {
    const values = {
      inventoryItemId: params.inventoryItemId,
      month: params.month,
      year: params.year,
      endCount: params.endCount,
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

  private assertDistributionCanClose(params: {
    balanceBeforeBoxes: number;
    endCount: number;
  }) {
    if (params.endCount <= params.balanceBeforeBoxes + DECIMAL_EPSILON) {
      return;
    }

    throw new HttpError(
      400,
      'End count cannot exceed the available balance before month-end distribution',
      'BAD_REQUEST',
    );
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

  private async processCount(params: {
    tx: InventoryCountWriteTx;
    input: BulkMonthEndCountInput['counts'][number];
    item: InventoryItem;
    existingCount: typeof inventoryMonthEndCounts.$inferSelect | undefined;
    existingTransaction: InventoryTransaction | undefined;
    previousMonthEndCount: number;
    transactionBoxes: number;
    totalDistributionBoxes: number;
    month: number;
    year: number;
    transactionDate: string;
    userId: string;
  }) {
    const endCount = roundDecimals(params.input.endCount, 2);
    const previousMonthEndDistributionBoxes = roundDecimals(
      params.existingTransaction?.boxes ?? 0,
      2,
    );
    const otherDistributionBoxes = roundDecimals(
      params.totalDistributionBoxes - previousMonthEndDistributionBoxes,
      2,
    );
    const balanceBeforeBoxes = roundDecimals(
      params.previousMonthEndCount +
        params.transactionBoxes -
        otherDistributionBoxes,
      2,
    );

    this.assertDistributionCanClose({ balanceBeforeBoxes, endCount });

    const distributionBoxes = roundDecimals(balanceBeforeBoxes - endCount, 2);
    const inventoryBalanceAfterUpdate = roundDecimals(
      params.item.boxes -
        (distributionBoxes - previousMonthEndDistributionBoxes),
      2,
    );

    if (
      params.existingCount &&
      params.existingTransaction &&
      Math.abs(params.existingCount.endCount - endCount) <= DECIMAL_EPSILON &&
      Math.abs(params.existingTransaction.boxes - distributionBoxes) <=
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

    const transaction = await this.upsertDistribution({
      tx: params.tx,
      item: params.item,
      existingTransaction: params.existingTransaction,
      transactionDate: params.transactionDate,
      distributionBoxes,
      balanceBeforeBoxes,
      balanceAfterBoxes: endCount,
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
      inventoryItemId: params.item.id,
      endCount,
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

  async syncMonthEndCountForTransaction(params: {
    tx: InventoryCountWriteTx;
    inventoryItemId: string;
    transactionDate: string;
  }) {
    const period = getPeriodFromDate(params.transactionDate);
    const endCount = await this.getClosingBalanceForPeriod({
      tx: params.tx,
      inventoryItemId: params.inventoryItemId,
      month: period.month,
      year: period.year,
    });

    return this.upsertCount({
      tx: params.tx,
      inventoryItemId: params.inventoryItemId,
      month: period.month,
      year: period.year,
      endCount,
    });
  }

  async syncMonthEndCountsForTransactions(params: {
    tx: InventoryCountWriteTx;
    transactions: InventoryTransaction[];
  }) {
    const syncedKeys = new Set<string>();

    for (const transaction of params.transactions) {
      const period = getPeriodFromDate(transaction.transactionDate);
      const key = `${transaction.inventoryItemId}:${period.year}:${period.month}`;

      if (syncedKeys.has(key)) continue;

      syncedKeys.add(key);

      await this.syncMonthEndCountForTransaction({
        tx: params.tx,
        inventoryItemId: transaction.inventoryItemId,
        transactionDate: transaction.transactionDate,
      });
    }
  }

  async bulkMonthEndCount(input: BulkMonthEndCountInput, userId: string) {
    return db.transaction(async (tx) => {
      const inventoryItemIds = input.counts.map(
        (count) => count.inventoryItemId,
      );
      const transactionDate = getMonthEndDate(input.month, input.year);
      const startDate = getMonthStartDate(input.month, input.year);
      const previousPeriod = getPreviousPeriod(input.month, input.year);
      const previousEndDate = getMonthEndDate(
        previousPeriod.month,
        previousPeriod.year,
      );
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
      const previousCounts = await tx.query.inventoryMonthEndCounts.findMany({
        where: and(
          inArray(inventoryMonthEndCounts.inventoryItemId, inventoryItemIds),
          eq(inventoryMonthEndCounts.month, previousPeriod.month),
          eq(inventoryMonthEndCounts.year, previousPeriod.year),
        ),
      });
      const previousComputedRows = await tx
        .select({
          inventoryItemId: inventoryTransactions.inventoryItemId,
          endCount:
            sql<number>`(array_agg(${inventoryTransactions.balanceAfterBoxes} order by ${inventoryTransactions.transactionDate} desc, ${inventoryTransactions.createdAt} desc, ${inventoryTransactions.id} desc))[1]`.mapWith(
              Number,
            ),
        })
        .from(inventoryTransactions)
        .where(
          and(
            inArray(inventoryTransactions.inventoryItemId, inventoryItemIds),
            lte(inventoryTransactions.transactionDate, previousEndDate),
          ),
        )
        .groupBy(inventoryTransactions.inventoryItemId);
      const monthlySummaryRows = await tx
        .select({
          inventoryItemId: inventoryTransactions.inventoryItemId,
          transactionBoxes:
            sql<number>`coalesce(sum(case when ${inventoryTransactions.transactionType} <> 'Distribution' then ${inventoryTransactions.balanceAfterBoxes} - ${inventoryTransactions.balanceBeforeBoxes} else 0 end), 0)`.mapWith(
              Number,
            ),
          distributionBoxes:
            sql<number>`coalesce(sum(case when ${inventoryTransactions.transactionType} = 'Distribution' then ${inventoryTransactions.boxes} else 0 end), 0)`.mapWith(
              Number,
            ),
        })
        .from(inventoryTransactions)
        .where(
          and(
            inArray(inventoryTransactions.inventoryItemId, inventoryItemIds),
            gte(inventoryTransactions.transactionDate, startDate),
            lte(inventoryTransactions.transactionDate, transactionDate),
          ),
        )
        .groupBy(inventoryTransactions.inventoryItemId);
      const existingTransactions =
        await tx.query.inventoryTransactions.findMany({
          where: and(
            inArray(inventoryTransactions.inventoryItemId, inventoryItemIds),
            eq(inventoryTransactions.transactionType, 'Distribution'),
            eq(inventoryTransactions.transactionDate, transactionDate),
          ),
        });
      const itemsById = new Map(items.map((item) => [item.id, item]));
      const countsByItemId = new Map(
        existingCounts.map((count) => [count.inventoryItemId, count]),
      );
      const previousCountsByItemId = new Map(
        previousCounts.map((count) => [count.inventoryItemId, count]),
      );
      const previousComputedByItemId = new Map(
        previousComputedRows.map((row) => [row.inventoryItemId, row.endCount]),
      );
      const monthlySummaryByItemId = new Map(
        monthlySummaryRows.map((row) => [row.inventoryItemId, row]),
      );
      const transactionsByItemId = new Map<string, InventoryTransaction>();
      const transactionCountsByItemId = new Map<string, number>();

      for (const transaction of existingTransactions) {
        transactionCountsByItemId.set(
          transaction.inventoryItemId,
          (transactionCountsByItemId.get(transaction.inventoryItemId) ?? 0) + 1,
        );

        if (!transactionsByItemId.has(transaction.inventoryItemId)) {
          transactionsByItemId.set(transaction.inventoryItemId, transaction);
        }
      }

      for (const [itemId, transactionCount] of transactionCountsByItemId) {
        if (transactionCount <= 1) continue;

        throw new HttpError(
          409,
          `Inventory item ${itemId} already has multiple Distribution transactions for ${input.month}/${input.year}`,
          'CONFLICT',
        );
      }

      const results: BulkMonthEndCountResultItem[] = [];

      for (const countInput of input.counts) {
        const item = itemsById.get(countInput.inventoryItemId);

        if (!item) {
          throw new HttpError(404, 'Inventory item not found', 'NOT_FOUND');
        }

        const previousMonthEndCount = roundDecimals(
          previousCountsByItemId.get(countInput.inventoryItemId)?.endCount ??
            previousComputedByItemId.get(countInput.inventoryItemId) ??
            0,
          2,
        );
        const monthlySummary = monthlySummaryByItemId.get(
          countInput.inventoryItemId,
        );

        results.push(
          await this.processCount({
            tx,
            input: countInput,
            item,
            existingCount: countsByItemId.get(countInput.inventoryItemId),
            existingTransaction: transactionsByItemId.get(
              countInput.inventoryItemId,
            ),
            previousMonthEndCount,
            transactionBoxes: roundDecimals(
              monthlySummary?.transactionBoxes ?? 0,
              2,
            ),
            totalDistributionBoxes: roundDecimals(
              monthlySummary?.distributionBoxes ?? 0,
              2,
            ),
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
