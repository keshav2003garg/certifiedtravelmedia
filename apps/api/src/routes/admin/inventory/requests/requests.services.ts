import db from '@/db';

import { and, asc, count, desc, eq, isNull, or, sql } from 'drizzle-orm';
import { exists } from 'drizzle-orm';

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
  inventoryTransactionRequests,
  inventoryTransactions,
  userSchema,
  warehouses,
} from '@services/database/schemas';

import { inventoryCountsService } from '../counts/counts.services';

import type { SQL } from 'drizzle-orm';
import type {
  ApproveInventoryRequestInput,
  CreateInventoryRequestInput,
  ListInventoryRequestsParams,
  RejectInventoryRequestInput,
} from './requests.types';

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

type InventoryRequestWriteTx = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

interface ResolvedRequestCustomer {
  id: string | null;
  name: string | null;
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

    if (params.brochureId) {
      conditions.push(
        exists(
          db
            .select({ one: sql`1` })
            .from(brochures)
            .where(
              and(
                eq(brochures.id, params.brochureId),
                sql`${inventoryTransactionRequests.brochureName} ILIKE ${brochures.name}`,
              ),
            ),
        ),
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
        pendingBoxes:
          sql<number>`COALESCE(SUM(${inventoryTransactionRequests.boxes}) FILTER (WHERE ${inventoryTransactionRequests.status} = 'Pending'), 0)`.mapWith(
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
      pendingBoxes: rows?.pendingBoxes ?? 0,
    };
  }

  async getById(id: string) {
    const [row] = await db
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
      .where(eq(inventoryTransactionRequests.id, id))
      .limit(1);

    if (!row) {
      throw new HttpError(404, 'Inventory request not found', 'NOT_FOUND');
    }

    return row;
  }

  private async assertRequestCanBeApproved(
    tx: InventoryRequestWriteTx,
    id: string,
  ) {
    const request = await tx.query.inventoryTransactionRequests.findFirst({
      where: eq(inventoryTransactionRequests.id, id),
    });

    if (!request) {
      throw new HttpError(404, 'Inventory request not found', 'NOT_FOUND');
    }

    if (request.status !== 'Pending') {
      throw new HttpError(
        409,
        `Inventory request is already ${request.status.toLowerCase()}`,
        'CONFLICT',
      );
    }
  }

  private async assertApprovalReferences(
    tx: InventoryRequestWriteTx,
    values: ApproveInventoryRequestInput,
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

  private async resolveApprovalCustomer(
    tx: InventoryRequestWriteTx,
    values: ApproveInventoryRequestInput,
  ): Promise<ResolvedRequestCustomer> {
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
    tx: InventoryRequestWriteTx;
    values: ApproveInventoryRequestInput;
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
    tx: InventoryRequestWriteTx;
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
    tx: InventoryRequestWriteTx;
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
    tx: InventoryRequestWriteTx;
    warehouseId: string;
    brochureImagePackSizeId: string;
    boxes: number;
    transactionType: ApproveInventoryRequestInput['transactionType'];
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

      return { item, balanceBefore, balanceAfter };
    }

    const [item] = await params.tx
      .insert(inventoryItems)
      .values({
        warehouseId: params.warehouseId,
        brochureImagePackSizeId: params.brochureImagePackSizeId,
        boxes: balanceAfter,
      })
      .returning();

    if (!item) {
      throw new HttpError(
        500,
        'Failed to create inventory item',
        'INTERNAL_SERVER',
      );
    }

    return { item, balanceBefore, balanceAfter };
  }

  private async recordApprovalTransaction(params: {
    tx: InventoryRequestWriteTx;
    itemId: string;
    requestId: string;
    values: ApproveInventoryRequestInput;
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
        transactionDate: params.values.dateReceived,
        boxes: params.boxes,
        balanceBeforeBoxes: params.balanceBefore,
        balanceAfterBoxes: params.balanceAfter,
        requestId: params.requestId,
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

  private async markRequestApproved(params: {
    tx: InventoryRequestWriteTx;
    id: string;
    values: ApproveInventoryRequestInput;
    customer: ResolvedRequestCustomer;
    itemId: string;
    transactionId: string;
    userId: string;
  }) {
    const reviewedAt = new Date().toISOString();
    const [request] = await params.tx
      .update(inventoryTransactionRequests)
      .set({
        status: 'Approved',
        warehouseId: params.values.warehouseId,
        brochureTypeId: params.values.brochureTypeId,
        brochureName: params.values.brochureName,
        customerName: params.customer.name,
        imageUrl: params.values.imageUrl ?? null,
        dateReceived: params.values.dateReceived,
        boxes: params.values.boxes,
        unitsPerBox: this.normalizeUnitsPerBox(params.values.unitsPerBox),
        transactionType: params.values.transactionType,
        notes: this.normalizeNullableString(params.values.notes),
        reviewedBy: params.userId,
        reviewedAt,
        approvedInventoryItemId: params.itemId,
        approvedTransactionId: params.transactionId,
        rejectionReason: null,
        updatedAt: reviewedAt,
      })
      .where(
        and(
          eq(inventoryTransactionRequests.id, params.id),
          eq(inventoryTransactionRequests.status, 'Pending'),
        ),
      )
      .returning({
        id: inventoryTransactionRequests.id,
        status: inventoryTransactionRequests.status,
        reviewedAt: inventoryTransactionRequests.reviewedAt,
      });

    if (!request) {
      throw new HttpError(
        409,
        'Inventory request is no longer pending',
        'CONFLICT',
      );
    }

    return request;
  }

  async approve(
    id: string,
    values: ApproveInventoryRequestInput,
    userId: string,
  ) {
    return db.transaction(async (tx) => {
      await this.assertRequestCanBeApproved(tx, id);
      await this.assertApprovalReferences(tx, values);

      const customer = await this.resolveApprovalCustomer(tx, values);
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
      const transaction = await this.recordApprovalTransaction({
        tx,
        itemId: inventoryResult.item.id,
        requestId: id,
        values,
        boxes,
        balanceBefore: inventoryResult.balanceBefore,
        balanceAfter: inventoryResult.balanceAfter,
        userId,
      });
      await inventoryCountsService.syncMonthEndCountForTransaction({
        tx,
        inventoryItemId: transaction.inventoryItemId,
        transactionDate: transaction.transactionDate,
      });
      const request = await this.markRequestApproved({
        tx,
        id,
        values,
        customer,
        itemId: inventoryResult.item.id,
        transactionId: transaction.id,
        userId,
      });

      return {
        request,
        item: inventoryResult.item,
        transaction,
        brochure,
        image,
        packSize,
      };
    });
  }

  async reject(
    id: string,
    values: RejectInventoryRequestInput,
    userId: string,
  ) {
    const request = await db.query.inventoryTransactionRequests.findFirst({
      where: eq(inventoryTransactionRequests.id, id),
    });

    if (!request) {
      throw new HttpError(404, 'Inventory request not found', 'NOT_FOUND');
    }

    if (request.status !== 'Pending') {
      throw new HttpError(
        409,
        `Inventory request is already ${request.status.toLowerCase()}`,
        'CONFLICT',
      );
    }

    const reviewedAt = new Date().toISOString();

    const [updated] = await db
      .update(inventoryTransactionRequests)
      .set({
        status: 'Rejected',
        reviewedBy: userId,
        reviewedAt,
        rejectionReason: values.rejectionReason,
        updatedAt: reviewedAt,
      })
      .where(eq(inventoryTransactionRequests.id, id))
      .returning({
        id: inventoryTransactionRequests.id,
        status: inventoryTransactionRequests.status,
        reviewedAt: inventoryTransactionRequests.reviewedAt,
        rejectionReason: inventoryTransactionRequests.rejectionReason,
      });

    if (!updated) {
      throw new HttpError(
        500,
        'Failed to update inventory request',
        'INTERNAL_SERVER',
      );
    }

    return updated;
  }
}

export const inventoryRequestsService = new InventoryRequestsService();
