import db from '@/db';

import { and, asc, count, desc, eq, inArray, ne, or, sql } from 'drizzle-orm';

import HttpError from '@repo/server-utils/errors/http-error';
import {
  createPaginatedResult,
  getPaginationOffset,
} from '@repo/server-utils/utils/pagination';

import { brochures, contracts, customers } from '@services/database/schemas';

import type { SQL } from 'drizzle-orm';
import type { Customer } from '@services/database/types';
import type {
  CreateCustomerInput,
  CustomerWithUsage,
  ListCustomersParams,
  ListCustomersResult,
  UpdateCustomerInput,
} from './customers.types';

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

function isDatabaseError(error: unknown): error is { code?: string } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

function rethrowCustomerWriteError(error: unknown): never {
  if (isDatabaseError(error) && error.code === '23505') {
    throw new HttpError(
      409,
      'Customer with this Acumatica ID already exists',
      'CONFLICT',
    );
  }

  if (isDatabaseError(error) && error.code === '23503') {
    throw new HttpError(
      409,
      'Customer is in use and cannot be deleted',
      'CONFLICT',
    );
  }

  throw error;
}

class CustomersService {
  private async getByIdOrThrow(id: string) {
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, id),
    });

    if (!customer) {
      throw new HttpError(404, 'Customer not found', 'NOT_FOUND');
    }

    return customer;
  }

  private async assertAcumaticaIdAvailable(
    acumaticaId: string,
    currentId?: string,
  ) {
    const conditions: SQL[] = [eq(customers.acumaticaId, acumaticaId)];

    if (currentId) {
      conditions.push(ne(customers.id, currentId));
    }

    const existing = await db.query.customers.findFirst({
      where: and(...conditions),
    });

    if (existing) {
      throw new HttpError(
        409,
        'Customer with this Acumatica ID already exists',
        'CONFLICT',
      );
    }
  }

  private async getUsageCountsByCustomerId(ids: string[]) {
    const countsByCustomerId = new Map<
      string,
      { brochureCount: number; contractCount: number }
    >();

    if (ids.length === 0) {
      return countsByCustomerId;
    }

    const [brochureRows, contractRows] = await Promise.all([
      db
        .select({
          customerId: brochures.customerId,
          brochureCount: count(brochures.id),
        })
        .from(brochures)
        .where(inArray(brochures.customerId, ids))
        .groupBy(brochures.customerId),
      db
        .select({
          customerId: contracts.customerUuid,
          contractCount: count(contracts.id),
        })
        .from(contracts)
        .where(inArray(contracts.customerUuid, ids))
        .groupBy(contracts.customerUuid),
    ]);

    for (const customerId of ids) {
      countsByCustomerId.set(customerId, {
        brochureCount: 0,
        contractCount: 0,
      });
    }

    for (const row of brochureRows) {
      if (!row.customerId) continue;
      const counts = countsByCustomerId.get(row.customerId) ?? {
        brochureCount: 0,
        contractCount: 0,
      };
      counts.brochureCount = row.brochureCount;
      countsByCustomerId.set(row.customerId, counts);
    }

    for (const row of contractRows) {
      if (!row.customerId) continue;
      const counts = countsByCustomerId.get(row.customerId) ?? {
        brochureCount: 0,
        contractCount: 0,
      };
      counts.contractCount = row.contractCount;
      countsByCustomerId.set(row.customerId, counts);
    }

    return countsByCustomerId;
  }

  private async withUsage(customer: Customer): Promise<CustomerWithUsage> {
    const countsByCustomerId = await this.getUsageCountsByCustomerId([
      customer.id,
    ]);
    const counts = countsByCustomerId.get(customer.id) ?? {
      brochureCount: 0,
      contractCount: 0,
    };

    return {
      ...customer,
      ...counts,
    };
  }

  private async assertNotInUse(id: string) {
    const countsByCustomerId = await this.getUsageCountsByCustomerId([id]);
    const counts = countsByCustomerId.get(id) ?? {
      brochureCount: 0,
      contractCount: 0,
    };

    if (counts.brochureCount > 0 || counts.contractCount > 0) {
      throw new HttpError(
        409,
        'Customer is in use and cannot be deleted',
        'CONFLICT',
      );
    }
  }

  private buildWhereClause(params: ListCustomersParams) {
    const conditions: SQL[] = [];

    if (params.search) {
      const search = `%${escapeLike(params.search)}%`;

      conditions.push(
        or(
          sql`${customers.name} ILIKE ${search} ESCAPE '\\'`,
          sql`${customers.acumaticaId} ILIKE ${search} ESCAPE '\\'`,
        )!,
      );
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  private getOrderBy(params: ListCustomersParams) {
    const sortBy = params.sortBy ?? 'name';
    const column =
      sortBy === 'acumaticaId'
        ? customers.acumaticaId
        : sortBy === 'createdAt'
          ? customers.createdAt
          : sortBy === 'updatedAt'
            ? customers.updatedAt
            : customers.name;

    return params.order === 'desc'
      ? [desc(column), desc(customers.id)]
      : [asc(column), asc(customers.id)];
  }

  async list(params: ListCustomersParams): Promise<ListCustomersResult> {
    const whereClause = this.buildWhereClause(params);

    const [countRows, rows] = await Promise.all([
      db.select({ total: count() }).from(customers).where(whereClause),
      db
        .select()
        .from(customers)
        .where(whereClause)
        .orderBy(...this.getOrderBy(params))
        .limit(params.limit)
        .offset(getPaginationOffset(params)),
    ]);

    const total = countRows[0]?.total ?? 0;
    const countsByCustomerId = await this.getUsageCountsByCustomerId(
      rows.map((row) => row.id),
    );

    const data = rows.map((row) => ({
      ...row,
      ...(countsByCustomerId.get(row.id) ?? {
        brochureCount: 0,
        contractCount: 0,
      }),
    }));

    return createPaginatedResult({
      data,
      page: params.page,
      limit: params.limit,
      total,
    });
  }

  async getById(id: string) {
    const customer = await this.getByIdOrThrow(id);

    return this.withUsage(customer);
  }

  async create(values: CreateCustomerInput) {
    await this.assertAcumaticaIdAvailable(values.acumaticaId);

    let customer: Customer | undefined;

    try {
      [customer] = await db
        .insert(customers)
        .values({
          acumaticaId: values.acumaticaId,
          name: values.name,
        })
        .returning();
    } catch (error) {
      rethrowCustomerWriteError(error);
    }

    if (!customer) {
      throw new HttpError(500, 'Failed to create customer', 'INTERNAL_SERVER');
    }

    return this.withUsage(customer);
  }

  async update(id: string, values: UpdateCustomerInput) {
    const existing = await this.getByIdOrThrow(id);
    const nextAcumaticaId = values.acumaticaId ?? existing.acumaticaId;
    const nextName = values.name ?? existing.name;

    if (
      values.acumaticaId !== undefined &&
      nextAcumaticaId !== existing.acumaticaId
    ) {
      await this.assertAcumaticaIdAvailable(nextAcumaticaId, id);
    }

    if (
      nextAcumaticaId === existing.acumaticaId &&
      nextName === existing.name
    ) {
      return this.withUsage(existing);
    }

    let updated: Customer | undefined;

    try {
      [updated] = await db
        .update(customers)
        .set({
          acumaticaId: nextAcumaticaId,
          name: nextName,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(customers.id, id))
        .returning();
    } catch (error) {
      rethrowCustomerWriteError(error);
    }

    if (!updated) {
      throw new HttpError(500, 'Failed to update customer', 'INTERNAL_SERVER');
    }

    return this.withUsage(updated);
  }

  async delete(id: string) {
    const existing = await this.getByIdOrThrow(id);

    await this.assertNotInUse(id);

    let deleted: Customer | undefined;

    try {
      [deleted] = await db
        .delete(customers)
        .where(eq(customers.id, id))
        .returning();
    } catch (error) {
      rethrowCustomerWriteError(error);
    }

    return {
      ...(deleted ?? existing),
      brochureCount: 0,
      contractCount: 0,
    };
  }
}

export const customersService = new CustomersService();
