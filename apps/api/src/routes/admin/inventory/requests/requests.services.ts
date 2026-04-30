import db from '@/db';

import { and, eq } from 'drizzle-orm';

import HttpError from '@repo/server-utils/errors/http-error';

import {
  brochureTypes,
  inventoryTransactionRequests,
  warehouses,
} from '@services/database/schemas';

import type { CreateInventoryRequestInput } from './requests.types';

class InventoryRequestsService {
  private normalizeNullableString(value: string | undefined) {
    if (!value) return null;
    const trimmed = value.trim().replace(/\s+/g, ' ');
    return trimmed.length > 0 ? trimmed : null;
  }

  private normalizeUnitsPerBox(value: number) {
    return Number(value.toFixed(2));
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
}

export const inventoryRequestsService = new InventoryRequestsService();
