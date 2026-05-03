import db from '@/db';

import { and, asc, eq, inArray, lte } from 'drizzle-orm';

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
  userSchema,
  warehouses,
} from '@services/database/schemas';

import type {
  CustomerYearlyReportMonth,
  CustomerYearlyReportParams,
  CustomerYearlyReportResult,
  InventoryMonthlyReportItem,
  InventoryMonthlyReportParams,
  InventoryMonthlyReportPeriod,
  InventoryMonthlyReportResult,
  InventoryMonthlyReportTransaction,
} from './reports.types';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getReportPeriod(
  month: number,
  year: number,
): InventoryMonthlyReportPeriod {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return {
    month,
    year,
    label: `${MONTH_NAMES[month - 1]} ${year}`,
    startDate: toIsoDate(year, month, 1),
    endDate: toIsoDate(year, month, lastDay),
  };
}

function createEmptySummary(): InventoryMonthlyReportResult['summary'] {
  return {
    inventoryItemCount: 0,
    transactionCount: 0,
    startingBalanceBoxes: 0,
    startingBalanceUnits: 0,
    endingBalanceBoxes: 0,
    endingBalanceUnits: 0,
    netMovementBoxes: 0,
    netMovementUnits: 0,
  };
}

function getYearPeriod(year: number): CustomerYearlyReportResult['period'] {
  return {
    year,
    label: String(year),
    startDate: toIsoDate(year, 1, 1),
    endDate: toIsoDate(year, 12, 31),
  };
}

type ReportInventoryRow = Awaited<
  ReturnType<ReportsService['getReportInventoryRows']>
>[number];

type ReportTransactionRow = Awaited<
  ReturnType<ReportsService['getReportTransactionRows']>
>[number];

class ReportsService {
  private async getWarehouse(id: string) {
    const warehouse = await db.query.warehouses.findFirst({
      where: eq(warehouses.id, id),
    });

    if (!warehouse) {
      throw new HttpError(404, 'Warehouse not found', 'NOT_FOUND');
    }

    return warehouse;
  }

  private async getCustomer(id: string) {
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, id),
    });

    if (!customer) {
      throw new HttpError(404, 'Customer not found', 'NOT_FOUND');
    }

    return customer;
  }

  private getReportInventoryRows(warehouseId: string) {
    return db
      .select({
        id: inventoryItems.id,
        warehouseId: inventoryItems.warehouseId,
        warehouseName: warehouses.name,
        brochureImagePackSizeId: inventoryItems.brochureImagePackSizeId,
        currentBoxes: inventoryItems.boxes,
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
      .innerJoin(brochureTypes, eq(brochures.brochureTypeId, brochureTypes.id))
      .leftJoin(customers, eq(brochures.customerId, customers.id))
      .where(eq(inventoryItems.warehouseId, warehouseId))
      .orderBy(
        asc(customers.name),
        asc(brochures.name),
        asc(brochureTypes.name),
        asc(brochureImagePackSizes.unitsPerBox),
        asc(inventoryItems.id),
      );
  }

  private getCustomerReportInventoryRows(customerId: string) {
    return db
      .select({
        id: inventoryItems.id,
        warehouseId: inventoryItems.warehouseId,
        warehouseName: warehouses.name,
        brochureImagePackSizeId: inventoryItems.brochureImagePackSizeId,
        currentBoxes: inventoryItems.boxes,
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
      .innerJoin(brochureTypes, eq(brochures.brochureTypeId, brochureTypes.id))
      .innerJoin(customers, eq(brochures.customerId, customers.id))
      .where(eq(brochures.customerId, customerId))
      .orderBy(
        asc(warehouses.name),
        asc(brochures.name),
        asc(brochureTypes.name),
        asc(brochureImagePackSizes.unitsPerBox),
        asc(inventoryItems.id),
      );
  }

  private getReportTransactionRows(itemIds: string[], endDate: string) {
    return db
      .select({
        id: inventoryTransactions.id,
        inventoryItemId: inventoryTransactions.inventoryItemId,
        transactionType: inventoryTransactions.transactionType,
        transactionDate: inventoryTransactions.transactionDate,
        boxes: inventoryTransactions.boxes,
        balanceBeforeBoxes: inventoryTransactions.balanceBeforeBoxes,
        balanceAfterBoxes: inventoryTransactions.balanceAfterBoxes,
        notes: inventoryTransactions.notes,
        createdBy: inventoryTransactions.createdBy,
        createdByName: userSchema.name,
        createdByEmail: userSchema.email,
        createdAt: inventoryTransactions.createdAt,
      })
      .from(inventoryTransactions)
      .leftJoin(userSchema, eq(inventoryTransactions.createdBy, userSchema.id))
      .where(
        and(
          inArray(inventoryTransactions.inventoryItemId, itemIds),
          lte(inventoryTransactions.transactionDate, endDate),
        ),
      )
      .orderBy(
        asc(inventoryTransactions.inventoryItemId),
        asc(inventoryTransactions.transactionDate),
        asc(inventoryTransactions.createdAt),
        asc(inventoryTransactions.id),
      );
  }

  private buildReportTransaction(
    row: ReportTransactionRow,
    unitsPerBox: number,
  ): InventoryMonthlyReportTransaction {
    const movementBoxes = roundDecimals(
      row.balanceAfterBoxes - row.balanceBeforeBoxes,
    );

    return {
      id: row.id,
      transactionType: row.transactionType,
      transactionDate: row.transactionDate,
      boxes: row.boxes,
      movementBoxes,
      movementUnits: roundDecimals(movementBoxes * unitsPerBox),
      balanceBeforeBoxes: row.balanceBeforeBoxes,
      balanceAfterBoxes: row.balanceAfterBoxes,
      notes: row.notes,
      createdBy: row.createdBy,
      createdByName: row.createdByName,
      createdByEmail: row.createdByEmail,
      createdAt: row.createdAt,
    };
  }

  private buildReportItem(params: {
    item: ReportInventoryRow;
    rows: ReportTransactionRow[];
    period: InventoryMonthlyReportPeriod;
  }): InventoryMonthlyReportItem {
    const periodTransactions = params.rows.filter(
      (row) => row.transactionDate >= params.period.startDate,
    );
    const latestBeforePeriod = params.rows
      .filter((row) => row.transactionDate < params.period.startDate)
      .at(-1);
    const latestThroughPeriod = params.rows.at(-1);
    const firstPeriodTransaction = periodTransactions[0];

    const startingBalanceBoxes =
      latestBeforePeriod?.balanceAfterBoxes ??
      firstPeriodTransaction?.balanceBeforeBoxes ??
      params.item.currentBoxes;
    const endingBalanceBoxes =
      latestThroughPeriod?.balanceAfterBoxes ?? startingBalanceBoxes;

    const transactions = periodTransactions.map((row) =>
      this.buildReportTransaction(row, params.item.unitsPerBox),
    );
    const netMovementBoxes = roundDecimals(
      endingBalanceBoxes - startingBalanceBoxes,
    );

    return {
      id: params.item.id,
      brochureImagePackSizeId: params.item.brochureImagePackSizeId,
      brochureId: params.item.brochureId,
      brochureName: params.item.brochureName,
      brochureTypeId: params.item.brochureTypeId,
      brochureTypeName: params.item.brochureTypeName,
      customerId: params.item.customerId,
      customerName: params.item.customerName,
      brochureImageId: params.item.brochureImageId,
      imageUrl: params.item.imageUrl,
      warehouseId: params.item.warehouseId,
      warehouseName: params.item.warehouseName,
      currentBoxes: params.item.currentBoxes,
      unitsPerBox: params.item.unitsPerBox,
      currentUnits: roundDecimals(
        params.item.currentBoxes * params.item.unitsPerBox,
      ),
      startingBalanceBoxes,
      startingBalanceUnits: roundDecimals(
        startingBalanceBoxes * params.item.unitsPerBox,
      ),
      endingBalanceBoxes,
      endingBalanceUnits: roundDecimals(
        endingBalanceBoxes * params.item.unitsPerBox,
      ),
      netMovementBoxes,
      netMovementUnits: roundDecimals(
        netMovementBoxes * params.item.unitsPerBox,
      ),
      transactionCount: transactions.length,
      hasLedgerBalance: Boolean(
        latestBeforePeriod || latestThroughPeriod || firstPeriodTransaction,
      ),
      transactions,
    };
  }

  private buildSummary(items: InventoryMonthlyReportItem[]) {
    return items.reduce((summary, item) => {
      summary.inventoryItemCount += 1;
      summary.transactionCount += item.transactionCount;
      summary.startingBalanceBoxes = roundDecimals(
        summary.startingBalanceBoxes + item.startingBalanceBoxes,
      );
      summary.startingBalanceUnits = roundDecimals(
        summary.startingBalanceUnits + item.startingBalanceUnits,
      );
      summary.endingBalanceBoxes = roundDecimals(
        summary.endingBalanceBoxes + item.endingBalanceBoxes,
      );
      summary.endingBalanceUnits = roundDecimals(
        summary.endingBalanceUnits + item.endingBalanceUnits,
      );
      summary.netMovementBoxes = roundDecimals(
        summary.netMovementBoxes + item.netMovementBoxes,
      );
      summary.netMovementUnits = roundDecimals(
        summary.netMovementUnits + item.netMovementUnits,
      );

      return summary;
    }, createEmptySummary());
  }

  private buildCustomerReportMonth(params: {
    month: number;
    year: number;
    inventoryRows: ReportInventoryRow[];
    transactionsByItemId: Map<string, ReportTransactionRow[]>;
  }): CustomerYearlyReportMonth {
    const period = getReportPeriod(params.month, params.year);
    const items = params.inventoryRows.map((item) => {
      const rows = params.transactionsByItemId.get(item.id) ?? [];

      return this.buildReportItem({
        item,
        rows: rows.filter((row) => row.transactionDate <= period.endDate),
        period,
      });
    });
    const summary = this.buildSummary(items);

    return {
      ...period,
      inventoryItemCount: items.length,
      transactionCount: summary.transactionCount,
      startingBalanceBoxes: summary.startingBalanceBoxes,
      startingBalanceUnits: summary.startingBalanceUnits,
      endingBalanceBoxes: summary.endingBalanceBoxes,
      endingBalanceUnits: summary.endingBalanceUnits,
      netMovementBoxes: summary.netMovementBoxes,
      netMovementUnits: summary.netMovementUnits,
      items,
    };
  }

  private buildCustomerYearlySummary(
    inventoryItemCount: number,
    months: CustomerYearlyReportMonth[],
  ): CustomerYearlyReportResult['summary'] {
    const firstMonth = months[0];
    const lastMonth = months.at(-1);

    return {
      inventoryItemCount,
      transactionCount: months.reduce(
        (total, month) => total + month.transactionCount,
        0,
      ),
      startingBalanceBoxes: firstMonth?.startingBalanceBoxes ?? 0,
      startingBalanceUnits: firstMonth?.startingBalanceUnits ?? 0,
      endingBalanceBoxes: lastMonth?.endingBalanceBoxes ?? 0,
      endingBalanceUnits: lastMonth?.endingBalanceUnits ?? 0,
      netMovementBoxes: roundDecimals(
        months.reduce((total, month) => total + month.netMovementBoxes, 0),
      ),
      netMovementUnits: roundDecimals(
        months.reduce((total, month) => total + month.netMovementUnits, 0),
      ),
    };
  }

  async getInventoryMonthlyReport(params: InventoryMonthlyReportParams) {
    const period = getReportPeriod(params.month, params.year);
    const [warehouse, inventoryRows] = await Promise.all([
      this.getWarehouse(params.warehouseId),
      this.getReportInventoryRows(params.warehouseId),
    ]);
    const itemIds = inventoryRows.map((item) => item.id);
    const transactionRows =
      itemIds.length > 0
        ? await this.getReportTransactionRows(itemIds, period.endDate)
        : [];
    const transactionsByItemId = new Map<string, ReportTransactionRow[]>();

    for (const row of transactionRows) {
      const rows = transactionsByItemId.get(row.inventoryItemId) ?? [];
      rows.push(row);
      transactionsByItemId.set(row.inventoryItemId, rows);
    }

    const items = inventoryRows.map((item) =>
      this.buildReportItem({
        item,
        rows: transactionsByItemId.get(item.id) ?? [],
        period,
      }),
    );

    return {
      warehouse: {
        id: warehouse.id,
        name: warehouse.name,
        acumaticaId: warehouse.acumaticaId,
        address: warehouse.address,
      },
      period,
      summary: this.buildSummary(items),
      items,
    };
  }

  async getCustomerYearlyReport(
    params: CustomerYearlyReportParams,
  ): Promise<CustomerYearlyReportResult> {
    const period = getYearPeriod(params.year);
    const [customer, inventoryRows] = await Promise.all([
      this.getCustomer(params.customerId),
      this.getCustomerReportInventoryRows(params.customerId),
    ]);
    const itemIds = inventoryRows.map((item) => item.id);
    const transactionRows =
      itemIds.length > 0
        ? await this.getReportTransactionRows(itemIds, period.endDate)
        : [];
    const transactionsByItemId = new Map<string, ReportTransactionRow[]>();

    for (const row of transactionRows) {
      const rows = transactionsByItemId.get(row.inventoryItemId) ?? [];
      rows.push(row);
      transactionsByItemId.set(row.inventoryItemId, rows);
    }

    const months = Array.from({ length: 12 }, (_, index) =>
      this.buildCustomerReportMonth({
        month: index + 1,
        year: params.year,
        inventoryRows,
        transactionsByItemId,
      }),
    );

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        acumaticaId: customer.acumaticaId,
      },
      period,
      summary: this.buildCustomerYearlySummary(inventoryRows.length, months),
      months,
    };
  }
}

export const reportsService = new ReportsService();
