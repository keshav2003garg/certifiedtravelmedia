import db from '@/db';

import { and, asc, count, desc, eq, sql } from 'drizzle-orm';

import HttpError from '@repo/server-utils/errors/http-error';
import {
  createPaginatedResult,
  getPaginationOffset,
} from '@repo/server-utils/utils/pagination';
import { roundDecimals } from '@repo/utils/number';

import {
  brochureTypes,
  inventoryTransactionRequests,
  userSchema,
  warehouses,
} from '@services/database/schemas';

import type { SQL } from 'drizzle-orm';
import type {
  CreateInventoryRequestInput,
  ListInventoryRequestsParams,
} from './requests.types';

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

class InventoryRequestsService {
  private normalizeNullableString(value: string | undefined) {
    if (!value) return null;
    const trimmed = value.trim().replace(/\s+/g, ' ');
    return trimmed.length > 0 ? trimmed : null;
  }

  private normalizeUnitsPerBox(value: number) {
    return roundDecimals(value);
  }

  async create(values: CreateInventoryRequestInput, userId: string) {
    const [warehouse, brochureType] = await Promise.all([
      db.query.warehouses.findFirst({
        where: and(
          eq(warehouses.id, values.warehouseId),
          eq(warehouses.isActive, true),
        ),
      }),
      db.query.brochureTypes.findFirst({
        where: eq(brochureTypes.id, values.brochureTypeId),
      }),
    ]);

    if (!warehouse) {
      throw new HttpError(404, 'Warehouse not found or inactive', 'NOT_FOUND');
    }

    if (!brochureType) {
      throw new HttpError(404, 'Brochure type not found', 'NOT_FOUND');
    }

    const [request] = await db
      .insert(inventoryTransactionRequests)
      .values({
        warehouseId: values.warehouseId,
        brochureTypeId: values.brochureTypeId,
        brochureName: values.brochureName,
        customerName: this.normalizeNullableString(values.customerName),
        imageUrl: values.imageUrl ?? null,
        dateReceived: values.dateReceived,
        boxes: values.boxes,
        unitsPerBox: this.normalizeUnitsPerBox(values.unitsPerBox),
        transactionType: values.transactionType,
        notes: this.normalizeNullableString(values.notes),
        requestedBy: userId,
      })
      .returning({
        id: inventoryTransactionRequests.id,
        status: inventoryTransactionRequests.status,
        createdAt: inventoryTransactionRequests.createdAt,
      });

    if (!request) {
      throw new HttpError(
        500,
        'Failed to create inventory request',
        'INTERNAL_SERVER',
      );
    }

    return request;
  }

  private buildWhereClause(params: ListInventoryRequestsParams) {
    const conditions: SQL[] = [];

    if (params.search) {
      const pattern = `%${escapeLike(params.search)}%`;
      conditions.push(
        sql`(
          ${inventoryTransactionRequests.brochureName} ILIKE ${pattern} ESCAPE '\\'
          OR ${inventoryTransactionRequests.customerName} ILIKE ${pattern} ESCAPE '\\'
        )`,
      );
    }

    if (params.status) {
      conditions.push(eq(inventoryTransactionRequests.status, params.status));
    }

    if (params.transactionType) {
      conditions.push(
        eq(
          inventoryTransactionRequests.transactionType,
          params.transactionType,
        ),
      );
    }

    if (params.warehouseId) {
      conditions.push(
        eq(inventoryTransactionRequests.warehouseId, params.warehouseId),
      );
    }

    if (params.brochureTypeId) {
      conditions.push(
        eq(inventoryTransactionRequests.brochureTypeId, params.brochureTypeId),
      );
    }

    if (params.requestedBy) {
      conditions.push(
        eq(inventoryTransactionRequests.requestedBy, params.requestedBy),
      );
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  private getOrderBy(params: ListInventoryRequestsParams) {
    const sortBy = params.sortBy ?? 'createdAt';
    const column =
      sortBy === 'updatedAt'
        ? inventoryTransactionRequests.updatedAt
        : sortBy === 'dateReceived'
          ? inventoryTransactionRequests.dateReceived
          : sortBy === 'status'
            ? inventoryTransactionRequests.status
            : sortBy === 'brochureName'
              ? inventoryTransactionRequests.brochureName
              : inventoryTransactionRequests.createdAt;

    return params.order === 'asc'
      ? [asc(column), asc(inventoryTransactionRequests.id)]
      : [desc(column), desc(inventoryTransactionRequests.id)];
  }

  async list(params: ListInventoryRequestsParams) {
    const whereClause = this.buildWhereClause(params);

    const [countRows, rows] = await Promise.all([
      db
        .select({ total: count() })
        .from(inventoryTransactionRequests)
        .where(whereClause),
      db
        .select({
          id: inventoryTransactionRequests.id,
          status: inventoryTransactionRequests.status,
          warehouseId: inventoryTransactionRequests.warehouseId,
          brochureTypeId: inventoryTransactionRequests.brochureTypeId,
          brochureName: inventoryTransactionRequests.brochureName,
          customerName: inventoryTransactionRequests.customerName,
          imageUrl: inventoryTransactionRequests.imageUrl,
          dateReceived: inventoryTransactionRequests.dateReceived,
          boxes: inventoryTransactionRequests.boxes,
          unitsPerBox: inventoryTransactionRequests.unitsPerBox,
          transactionType: inventoryTransactionRequests.transactionType,
          notes: inventoryTransactionRequests.notes,
          rejectionReason: inventoryTransactionRequests.rejectionReason,
          requestedBy: inventoryTransactionRequests.requestedBy,
          reviewedBy: inventoryTransactionRequests.reviewedBy,
          reviewedAt: inventoryTransactionRequests.reviewedAt,
          createdAt: inventoryTransactionRequests.createdAt,
          updatedAt: inventoryTransactionRequests.updatedAt,
          warehouseName: warehouses.name,
          brochureTypeName: brochureTypes.name,
          requestedByName: userSchema.name,
          requestedByEmail: userSchema.email,
        })
        .from(inventoryTransactionRequests)
        .leftJoin(
          warehouses,
          eq(inventoryTransactionRequests.warehouseId, warehouses.id),
        )
        .leftJoin(
          brochureTypes,
          eq(inventoryTransactionRequests.brochureTypeId, brochureTypes.id),
        )
        .leftJoin(
          userSchema,
          eq(inventoryTransactionRequests.requestedBy, userSchema.id),
        )
        .where(whereClause)
        .orderBy(...this.getOrderBy(params))
        .limit(params.limit)
        .offset(getPaginationOffset(params)),
    ]);

    const total = countRows[0]?.total ?? 0;

    return createPaginatedResult({
      data: rows,
      page: params.page,
      limit: params.limit,
      total,
    });
  }

  async getStats() {
    const [rows] = await db
      .select({
        total: count(),
        pending:
          sql<number>`COUNT(*) FILTER (WHERE ${inventoryTransactionRequests.status} = 'Pending')`.mapWith(
            Number,
          ),
        approved:
          sql<number>`COUNT(*) FILTER (WHERE ${inventoryTransactionRequests.status} = 'Approved')`.mapWith(
            Number,
          ),
        rejected:
          sql<number>`COUNT(*) FILTER (WHERE ${inventoryTransactionRequests.status} = 'Rejected')`.mapWith(
            Number,
          ),
        cancelled:
          sql<number>`COUNT(*) FILTER (WHERE ${inventoryTransactionRequests.status} = 'Cancelled')`.mapWith(
            Number,
          ),
      })
      .from(inventoryTransactionRequests);

    return {
      total: rows?.total ?? 0,
      pending: rows?.pending ?? 0,
      approved: rows?.approved ?? 0,
      rejected: rows?.rejected ?? 0,
      cancelled: rows?.cancelled ?? 0,
    };
  }
}

export const inventoryRequestsService = new InventoryRequestsService();
