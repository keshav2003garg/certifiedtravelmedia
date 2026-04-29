import db from '@/db';

import { and, asc, count, desc, eq, ne, sql } from 'drizzle-orm';

import HttpError from '@repo/server-utils/errors/http-error';
import {
  createPaginatedResult,
  getPaginationOffset,
} from '@repo/server-utils/utils/pagination';

import {
  brochures,
  brochureTypes,
  inventoryTransactionRequests,
} from '@services/database/schemas';

import type { SQL } from 'drizzle-orm';
import type {
  CreateBrochureTypeInput,
  ListBrochureTypesParams,
  UpdateBrochureTypeInput,
} from './brochure-types.types';

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, ' ');
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

function isSameName(a: string, b: string) {
  return normalizeName(a).toLowerCase() === normalizeName(b).toLowerCase();
}

class BrochureTypesService {
  private async getByIdOrThrow(id: string) {
    const brochureType = await db.query.brochureTypes.findFirst({
      where: eq(brochureTypes.id, id),
    });

    if (!brochureType) {
      throw new HttpError(404, 'Brochure type not found', 'NOT_FOUND');
    }

    return brochureType;
  }

  private async assertNameAvailable(name: string, currentId?: string) {
    const normalizedName = normalizeName(name);
    const conditions: SQL[] = [
      sql`LOWER(${brochureTypes.name}) = LOWER(${normalizedName})`,
    ];

    if (currentId) {
      conditions.push(ne(brochureTypes.id, currentId));
    }

    const existing = await db.query.brochureTypes.findFirst({
      where: and(...conditions),
    });

    if (existing) {
      throw new HttpError(
        409,
        'A brochure type with this name already exists',
        'CONFLICT',
      );
    }
  }

  private async assertNotInUse(id: string) {
    const [brochureRows, requestRows] = await Promise.all([
      db
        .select({
          total: count(brochures.id),
        })
        .from(brochures)
        .where(eq(brochures.brochureTypeId, id)),
      db
        .select({
          total: count(inventoryTransactionRequests.id),
        })
        .from(inventoryTransactionRequests)
        .where(eq(inventoryTransactionRequests.brochureTypeId, id)),
    ]);

    const brochureCount = brochureRows[0]?.total ?? 0;
    const inventoryRequestCount = requestRows[0]?.total ?? 0;

    if (brochureCount > 0 || inventoryRequestCount > 0) {
      throw new HttpError(
        409,
        'Brochure type is in use and cannot be deleted',
        'CONFLICT',
      );
    }
  }

  private buildWhereClause(params: ListBrochureTypesParams) {
    const conditions: SQL[] = [];

    if (params.search) {
      conditions.push(
        sql`${brochureTypes.name} ILIKE ${`%${escapeLike(params.search)}%`} ESCAPE '\\'`,
      );
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  private getOrderBy(params: ListBrochureTypesParams) {
    const sortBy = params.sortBy ?? 'name';
    const column =
      sortBy === 'colSpan'
        ? brochureTypes.colSpan
        : sortBy === 'createdAt'
          ? brochureTypes.createdAt
          : sortBy === 'updatedAt'
            ? brochureTypes.updatedAt
            : brochureTypes.name;

    return params.order === 'desc'
      ? [desc(column), desc(brochureTypes.id)]
      : [asc(column), asc(brochureTypes.id)];
  }

  async list(params: ListBrochureTypesParams) {
    const whereClause = this.buildWhereClause(params);

    const [countRows, rows] = await Promise.all([
      db.select({ total: count() }).from(brochureTypes).where(whereClause),
      db
        .select()
        .from(brochureTypes)
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

  async getById(id: string) {
    const brochureType = await this.getByIdOrThrow(id);

    return brochureType;
  }

  async create(values: CreateBrochureTypeInput) {
    const name = normalizeName(values.name);

    await this.assertNameAvailable(name);

    const [brochureType] = await db
      .insert(brochureTypes)
      .values({
        name,
        colSpan: values.colSpan,
      })
      .returning();

    if (!brochureType) {
      throw new HttpError(
        500,
        'Failed to create brochure type',
        'INTERNAL_SERVER',
      );
    }

    return brochureType;
  }

  async update(id: string, values: UpdateBrochureTypeInput) {
    const existing = await this.getByIdOrThrow(id);
    const name =
      values.name !== undefined ? normalizeName(values.name) : undefined;
    const nextName = name ?? existing.name;
    const nextColSpan = values.colSpan ?? existing.colSpan;

    if (name !== undefined && !isSameName(name, existing.name)) {
      await this.assertNameAvailable(name, id);
    }

    if (nextName === existing.name && nextColSpan === existing.colSpan) {
      return existing;
    }

    const [updated] = await db
      .update(brochureTypes)
      .set({
        name: nextName,
        colSpan: nextColSpan,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(brochureTypes.id, id))
      .returning();

    if (!updated) {
      throw new HttpError(
        500,
        'Failed to update brochure type',
        'INTERNAL_SERVER',
      );
    }

    return updated;
  }

  async delete(id: string) {
    const existing = await this.getByIdOrThrow(id);

    await this.assertNotInUse(id);

    const [deleted] = await db
      .delete(brochureTypes)
      .where(eq(brochureTypes.id, id))
      .returning();

    return deleted ?? existing;
  }
}

export const brochureTypesService = new BrochureTypesService();
