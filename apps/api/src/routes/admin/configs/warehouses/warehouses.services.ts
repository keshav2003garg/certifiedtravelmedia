import db from '@/db';

import { and, asc, count, desc, eq, inArray, ne, or, sql } from 'drizzle-orm';

import HttpError from '@repo/server-utils/errors/http-error';
import {
  createPaginatedResult,
  getPaginationOffset,
} from '@repo/server-utils/utils/pagination';
import { escapeCsv } from '@repo/utils/csv';

import {
  contractDistributions,
  contracts,
  inventoryItems,
  sectors,
  warehouses,
  warehousesSectors,
} from '@services/database/schemas';

import type { SQL } from 'drizzle-orm';
import type { Warehouse } from '@services/database/types';
import type {
  CreateWarehouseInput,
  ExportWarehousesParams,
  ListSectorsParams,
  ListWarehousesParams,
  ListWarehousesResult,
  UpdateWarehouseInput,
  WarehouseSectorSummary,
  WarehouseWithDetails,
} from './warehouses.types';

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

function isDatabaseError(error: unknown): error is { code?: string } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

function rethrowWarehouseWriteError(error: unknown): never {
  if (isDatabaseError(error) && error.code === '23505') {
    throw new HttpError(
      409,
      'Warehouse with this Acumatica ID already exists',
      'CONFLICT',
    );
  }

  if (isDatabaseError(error) && error.code === '23503') {
    throw new HttpError(
      400,
      'One or more selected sectors do not exist',
      'BAD_REQUEST',
    );
  }

  throw error;
}

function haveSameIds(a: string[], b: string[]) {
  if (a.length !== b.length) return false;

  const ids = new Set(a);
  return b.every((id) => ids.has(id));
}

class WarehousesService {
  private normalizeNullableString(value: string | undefined) {
    if (value === undefined) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private async getSectorIdsForWarehouse(id: string) {
    const rows = await db
      .select({ sectorId: warehousesSectors.sectorId })
      .from(warehousesSectors)
      .where(eq(warehousesSectors.warehouseId, id));

    return rows.map((row) => row.sectorId);
  }

  private async getByIdOrThrow(id: string) {
    const warehouse = await db.query.warehouses.findFirst({
      where: eq(warehouses.id, id),
    });

    if (!warehouse) {
      throw new HttpError(404, 'Warehouse not found', 'NOT_FOUND');
    }

    return warehouse;
  }

  private async assertAcumaticaIdAvailable(
    acumaticaId: string | null,
    currentId?: string,
  ) {
    if (!acumaticaId) return;

    const conditions: SQL[] = [eq(warehouses.acumaticaId, acumaticaId)];

    if (currentId) {
      conditions.push(ne(warehouses.id, currentId));
    }

    const existing = await db.query.warehouses.findFirst({
      where: and(...conditions),
    });

    if (existing) {
      throw new HttpError(
        409,
        'Warehouse with this Acumatica ID already exists',
        'CONFLICT',
      );
    }
  }

  private async assertSectorsExist(sectorIds: string[]) {
    if (sectorIds.length === 0) return;

    const rows = await db
      .select({ id: sectors.id })
      .from(sectors)
      .where(inArray(sectors.id, sectorIds));

    if (rows.length !== sectorIds.length) {
      throw new HttpError(
        400,
        'One or more selected sectors do not exist',
        'BAD_REQUEST',
      );
    }
  }

  private async getSectorsByWarehouseId(ids: string[]) {
    const sectorsByWarehouseId = new Map<string, WarehouseSectorSummary[]>();

    for (const id of ids) {
      sectorsByWarehouseId.set(id, []);
    }

    if (ids.length === 0) {
      return sectorsByWarehouseId;
    }

    const rows = await db
      .select({
        warehouseId: warehousesSectors.warehouseId,
        id: sectors.id,
        description: sectors.description,
        acumaticaId: sectors.acumaticaId,
      })
      .from(warehousesSectors)
      .innerJoin(sectors, eq(warehousesSectors.sectorId, sectors.id))
      .where(inArray(warehousesSectors.warehouseId, ids))
      .orderBy(sectors.description);

    for (const row of rows) {
      const warehouseSectors = sectorsByWarehouseId.get(row.warehouseId) ?? [];
      warehouseSectors.push({
        id: row.id,
        description: row.description,
        acumaticaId: row.acumaticaId,
      });
      sectorsByWarehouseId.set(row.warehouseId, warehouseSectors);
    }

    return sectorsByWarehouseId;
  }

  private async getInventoryItemCountsByWarehouseId(ids: string[]) {
    const countsByWarehouseId = new Map<string, number>();

    for (const id of ids) {
      countsByWarehouseId.set(id, 0);
    }

    if (ids.length === 0) {
      return countsByWarehouseId;
    }

    const rows = await db
      .select({
        warehouseId: inventoryItems.warehouseId,
        inventoryItemCount: count(inventoryItems.id),
      })
      .from(inventoryItems)
      .where(inArray(inventoryItems.warehouseId, ids))
      .groupBy(inventoryItems.warehouseId);

    for (const row of rows) {
      countsByWarehouseId.set(row.warehouseId, row.inventoryItemCount);
    }

    return countsByWarehouseId;
  }

  private async withDetails(
    warehouse: Warehouse,
  ): Promise<WarehouseWithDetails> {
    const [sectorsByWarehouseId, inventoryCountsByWarehouseId] =
      await Promise.all([
        this.getSectorsByWarehouseId([warehouse.id]),
        this.getInventoryItemCountsByWarehouseId([warehouse.id]),
      ]);

    const warehouseSectors = sectorsByWarehouseId.get(warehouse.id) ?? [];

    return {
      ...warehouse,
      sectors: warehouseSectors,
      sectorCount: warehouseSectors.length,
      inventoryItemCount: inventoryCountsByWarehouseId.get(warehouse.id) ?? 0,
    };
  }

  private buildWhereClause(params: ListWarehousesParams) {
    const conditions: SQL[] = [];

    if (!params.includeInactive) {
      conditions.push(eq(warehouses.isActive, true));
    }

    if (params.search) {
      const search = `%${escapeLike(params.search)}%`;

      conditions.push(
        or(
          sql`${warehouses.name} ILIKE ${search} ESCAPE '\\'`,
          sql`${warehouses.address} ILIKE ${search} ESCAPE '\\'`,
          sql`${warehouses.acumaticaId} ILIKE ${search} ESCAPE '\\'`,
        )!,
      );
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  private getOrderBy(params: ListWarehousesParams) {
    const sortBy = params.sortBy ?? 'name';
    const column =
      sortBy === 'acumaticaId'
        ? warehouses.acumaticaId
        : sortBy === 'createdAt'
          ? warehouses.createdAt
          : sortBy === 'updatedAt'
            ? warehouses.updatedAt
            : warehouses.name;

    return params.order === 'desc'
      ? [desc(column), desc(warehouses.id)]
      : [asc(column), asc(warehouses.id)];
  }

  async list(params: ListWarehousesParams): Promise<ListWarehousesResult> {
    const whereClause = this.buildWhereClause(params);

    const [countRows, rows] = await Promise.all([
      db.select({ total: count() }).from(warehouses).where(whereClause),
      db
        .select()
        .from(warehouses)
        .where(whereClause)
        .orderBy(...this.getOrderBy(params))
        .limit(params.limit)
        .offset(getPaginationOffset(params)),
    ]);

    const total = countRows[0]?.total ?? 0;
    const warehouseIds = rows.map((row) => row.id);

    const [sectorsByWarehouseId, inventoryCountsByWarehouseId] =
      await Promise.all([
        this.getSectorsByWarehouseId(warehouseIds),
        this.getInventoryItemCountsByWarehouseId(warehouseIds),
      ]);

    const data = rows.map((row) => {
      const warehouseSectors = sectorsByWarehouseId.get(row.id) ?? [];

      return {
        ...row,
        sectors: warehouseSectors,
        sectorCount: warehouseSectors.length,
        inventoryItemCount: inventoryCountsByWarehouseId.get(row.id) ?? 0,
      };
    });

    return createPaginatedResult({
      data,
      page: params.page,
      limit: params.limit,
      total,
    });
  }

  async getById(id: string) {
    const warehouse = await this.getByIdOrThrow(id);

    return this.withDetails(warehouse);
  }

  async create(values: CreateWarehouseInput) {
    const acumaticaId = this.normalizeNullableString(values.acumaticaId);
    const address = this.normalizeNullableString(values.address);

    await this.assertAcumaticaIdAvailable(acumaticaId);
    await this.assertSectorsExist(values.sectorIds);

    let warehouse: Warehouse | undefined;

    try {
      warehouse = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(warehouses)
          .values({
            name: values.name,
            acumaticaId,
            address,
            isActive: values.isActive,
          })
          .returning();

        if (!created) {
          throw new HttpError(
            500,
            'Failed to create warehouse',
            'INTERNAL_SERVER',
          );
        }

        if (values.sectorIds.length > 0) {
          await tx.insert(warehousesSectors).values(
            values.sectorIds.map((sectorId) => ({
              warehouseId: created.id,
              sectorId,
            })),
          );
        }

        return created;
      });
    } catch (error) {
      rethrowWarehouseWriteError(error);
    }

    if (!warehouse) {
      throw new HttpError(500, 'Failed to create warehouse', 'INTERNAL_SERVER');
    }

    return this.withDetails(warehouse);
  }

  async update(id: string, values: UpdateWarehouseInput) {
    const existing = await this.getByIdOrThrow(id);

    const acumaticaId =
      values.acumaticaId !== undefined
        ? this.normalizeNullableString(values.acumaticaId)
        : undefined;
    const address =
      values.address !== undefined
        ? this.normalizeNullableString(values.address)
        : undefined;
    const name = values.name ?? existing.name;
    const isActive = values.isActive ?? existing.isActive;
    const nextAcumaticaId =
      values.acumaticaId !== undefined ? acumaticaId : existing.acumaticaId;
    const nextAddress =
      values.address !== undefined ? address : existing.address;

    if (acumaticaId !== undefined && acumaticaId !== existing.acumaticaId) {
      await this.assertAcumaticaIdAvailable(acumaticaId, id);
    }

    if (values.sectorIds !== undefined) {
      await this.assertSectorsExist(values.sectorIds);
    }

    const currentSectorIds =
      values.sectorIds !== undefined
        ? await this.getSectorIdsForWarehouse(id)
        : undefined;

    const sectorsChanged =
      values.sectorIds !== undefined &&
      !haveSameIds(currentSectorIds ?? [], values.sectorIds);

    if (
      name === existing.name &&
      nextAcumaticaId === existing.acumaticaId &&
      nextAddress === existing.address &&
      isActive === existing.isActive &&
      !sectorsChanged
    ) {
      return this.withDetails(existing);
    }

    let updated: Warehouse | undefined;

    try {
      updated = await db.transaction(async (tx) => {
        const [warehouse] = await tx
          .update(warehouses)
          .set({
            name,
            acumaticaId: nextAcumaticaId,
            address: nextAddress,
            isActive,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(warehouses.id, id))
          .returning();

        if (!warehouse) {
          throw new HttpError(
            500,
            'Failed to update warehouse',
            'INTERNAL_SERVER',
          );
        }

        if (sectorsChanged) {
          await tx
            .delete(warehousesSectors)
            .where(eq(warehousesSectors.warehouseId, id));

          if (values.sectorIds && values.sectorIds.length > 0) {
            await tx.insert(warehousesSectors).values(
              values.sectorIds.map((sectorId) => ({
                warehouseId: id,
                sectorId,
              })),
            );
          }
        }

        return warehouse;
      });
    } catch (error) {
      rethrowWarehouseWriteError(error);
    }

    if (!updated) {
      throw new HttpError(500, 'Failed to update warehouse', 'INTERNAL_SERVER');
    }

    return this.withDetails(updated);
  }

  async retire(id: string) {
    return this.update(id, { isActive: false });
  }

  async listSectors(params: ListSectorsParams) {
    const conditions: SQL[] = [];

    if (params.search) {
      const search = `%${escapeLike(params.search)}%`;

      conditions.push(
        or(
          sql`${sectors.description} ILIKE ${search} ESCAPE '\\'`,
          sql`${sectors.acumaticaId} ILIKE ${search} ESCAPE '\\'`,
        )!,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countRows, rows] = await Promise.all([
      db.select({ total: count() }).from(sectors).where(whereClause),
      db
        .select()
        .from(sectors)
        .where(whereClause)
        .orderBy(asc(sectors.description), asc(sectors.id))
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

  async exportCSV(params: ExportWarehousesParams) {
    const conditions: SQL[] = [];

    if (!params.includeInactive) {
      conditions.push(eq(warehouses.isActive, true));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select()
      .from(warehouses)
      .where(whereClause)
      .orderBy(asc(warehouses.name));

    const sectorsByWarehouseId = await this.getSectorsByWarehouseId(
      rows.map((row) => row.id),
    );

    const csvData = rows.map((warehouse) => {
      const warehouseSectors = sectorsByWarehouseId.get(warehouse.id) ?? [];

      return {
        Name: warehouse.name,
        'Warehouse ID': warehouse.acumaticaId ?? '',
        Address: warehouse.address ?? '',
        Status: warehouse.isActive ? 'Active' : 'Inactive',
        'Sector IDs': warehouseSectors
          .map((sector) => sector.acumaticaId)
          .join('; '),
        'Sector Descriptions': warehouseSectors
          .map((sector) => sector.description)
          .join('; '),
      };
    });

    return serializeCsv(csvData);
  }

  async getFullTruckLoad(warehouseId: string, month?: number, year?: number) {
    const warehouse = await this.getByIdOrThrow(warehouseId);

    const warehouseSectorRows = await db
      .select({ sectorId: warehousesSectors.sectorId })
      .from(warehousesSectors)
      .where(eq(warehousesSectors.warehouseId, warehouseId));

    const sectorIds = warehouseSectorRows.map((row) => row.sectorId);

    if (sectorIds.length === 0) {
      return {
        warehouseName: warehouse.name,
        distributions: [],
      };
    }

    let rangeStart: string;
    let rangeEnd: string;
    const periodConditions: SQL[] = [];

    if (month && year) {
      rangeStart = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      rangeEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      periodConditions.push(
        sql`${contractDistributions.beginningDate} >= ${rangeStart}`,
        sql`${contractDistributions.beginningDate} <= ${rangeEnd}`,
      );
    } else {
      const today = new Date().toISOString().split('T')[0]!;
      rangeStart = today;
      rangeEnd = today;
      periodConditions.push(
        sql`${contractDistributions.beginningDate} <= ${rangeEnd}`,
        sql`${contractDistributions.endingDate} >= ${rangeStart}`,
      );
    }

    const distributions = await db
      .selectDistinct({
        description: contractDistributions.description,
        unitOfMeasure: contractDistributions.unitOfMeasure,
        contractNumber: contracts.acumaticaContractId,
        endDate: contractDistributions.endingDate,
      })
      .from(contractDistributions)
      .innerJoin(contracts, eq(contractDistributions.contractId, contracts.id))
      .where(
        and(
          inArray(contractDistributions.sectorId, sectorIds),
          ...periodConditions,
        ),
      )
      .orderBy(contractDistributions.description);

    return {
      warehouseName: warehouse.name,
      distributions: distributions
        .filter((distribution) => distribution.description !== null)
        .map((distribution) => ({
          description: distribution.description!,
          size: distribution.unitOfMeasure === 'MAG' ? 'M' : 'B',
          contractNumber: distribution.contractNumber,
          endDate: distribution.endDate,
        })),
    };
  }
}

function serializeCsv(rows: Record<string, string>[]) {
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]!);
  const lines = [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) =>
      headers.map((header) => escapeCsv(row[header] ?? '')).join(','),
    ),
  ];

  return lines.join('\n');
}

export const warehousesService = new WarehousesService();
