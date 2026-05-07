import db from '@/db';

import { and, asc, count, desc, eq, inArray, or, sql } from 'drizzle-orm';

import HttpError from '@repo/server-utils/errors/http-error';
import {
  createPaginatedResult,
  getPaginationOffset,
} from '@repo/server-utils/utils/pagination';

import {
  brochureImagePackSizes,
  brochureImages,
  brochures,
  brochureTypes,
  customers,
  inventoryItems,
} from '@services/database/schemas';

import type { SQL } from 'drizzle-orm';
import type {
  InventoryBrochureImageWithPackSizes,
  InventoryBrochureListItem,
  InventoryBrochurePackSizeWithUsage,
  ListInventoryBrochuresParams,
} from './brochures.types';

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

class InventoryBrochuresService {
  private hasImagesCondition(value: boolean) {
    return sql<boolean>`
      ${value ? sql`EXISTS` : sql`NOT EXISTS`} (
        SELECT 1 FROM ${brochureImages}
        WHERE ${brochureImages.brochureId} = ${brochures.id}
      )
    `;
  }

  private hasPackSizesCondition(value: boolean) {
    return sql<boolean>`
      ${value ? sql`EXISTS` : sql`NOT EXISTS`} (
        SELECT 1
        FROM ${brochureImages}
        INNER JOIN ${brochureImagePackSizes}
          ON ${brochureImagePackSizes.brochureImageId} = ${brochureImages.id}
        WHERE ${brochureImages.brochureId} = ${brochures.id}
      )
    `;
  }

  private buildWhereClause(params: ListInventoryBrochuresParams) {
    const conditions: SQL[] = [];

    if (params.search) {
      const search = `%${escapeLike(params.search)}%`;

      conditions.push(
        or(
          sql`${brochures.name} ILIKE ${search} ESCAPE '\\'`,
          sql`${brochureTypes.name} ILIKE ${search} ESCAPE '\\'`,
          sql`${customers.name} ILIKE ${search} ESCAPE '\\'`,
        )!,
      );
    }

    if (params.brochureTypeId) {
      conditions.push(eq(brochures.brochureTypeId, params.brochureTypeId));
    }

    if (params.customerId) {
      conditions.push(eq(brochures.customerId, params.customerId));
    }

    if (params.hasImages !== undefined) {
      conditions.push(this.hasImagesCondition(params.hasImages));
    }

    if (params.hasPackSizes !== undefined) {
      conditions.push(this.hasPackSizesCondition(params.hasPackSizes));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  private getOrderBy(params: ListInventoryBrochuresParams) {
    const sortBy = params.sortBy ?? 'name';
    const column =
      sortBy === 'brochureTypeName'
        ? brochureTypes.name
        : sortBy === 'customerName'
          ? customers.name
          : sortBy === 'createdAt'
            ? brochures.createdAt
            : sortBy === 'updatedAt'
              ? brochures.updatedAt
              : brochures.name;

    return params.order === 'desc'
      ? [desc(column), desc(brochures.id)]
      : [asc(column), asc(brochures.id)];
  }

  private async getImageStatsByBrochureId(ids: string[]) {
    const statsByBrochureId = new Map<
      string,
      {
        primaryImageUrl: string | null;
        imageCount: number;
        packSizeCount: number;
      }
    >();

    for (const id of ids) {
      statsByBrochureId.set(id, {
        primaryImageUrl: null,
        imageCount: 0,
        packSizeCount: 0,
      });
    }

    if (ids.length === 0) return statsByBrochureId;

    const [imageRows, packSizeRows] = await Promise.all([
      db
        .select({
          brochureId: brochureImages.brochureId,
          imageUrl: brochureImages.imageUrl,
        })
        .from(brochureImages)
        .where(inArray(brochureImages.brochureId, ids))
        .orderBy(
          brochureImages.brochureId,
          brochureImages.sortOrder,
          brochureImages.createdAt,
        ),
      db
        .select({
          brochureId: brochureImages.brochureId,
          packSizeCount: count(brochureImagePackSizes.id),
        })
        .from(brochureImagePackSizes)
        .innerJoin(
          brochureImages,
          eq(brochureImagePackSizes.brochureImageId, brochureImages.id),
        )
        .where(inArray(brochureImages.brochureId, ids))
        .groupBy(brochureImages.brochureId),
    ]);

    for (const image of imageRows) {
      const stats = statsByBrochureId.get(image.brochureId) ?? {
        primaryImageUrl: null,
        imageCount: 0,
        packSizeCount: 0,
      };
      stats.imageCount += 1;
      stats.primaryImageUrl ??= image.imageUrl;
      statsByBrochureId.set(image.brochureId, stats);
    }

    for (const row of packSizeRows) {
      const stats = statsByBrochureId.get(row.brochureId) ?? {
        primaryImageUrl: null,
        imageCount: 0,
        packSizeCount: 0,
      };
      stats.packSizeCount = row.packSizeCount;
      statsByBrochureId.set(row.brochureId, stats);
    }

    return statsByBrochureId;
  }

  async list(params: ListInventoryBrochuresParams) {
    const whereClause = this.buildWhereClause(params);

    const [countRows, rows] = await Promise.all([
      db
        .select({
          total: sql<number>`COUNT(DISTINCT ${brochures.id})`.mapWith(Number),
        })
        .from(brochures)
        .innerJoin(
          brochureTypes,
          eq(brochures.brochureTypeId, brochureTypes.id),
        )
        .leftJoin(customers, eq(brochures.customerId, customers.id))
        .where(whereClause),
      db
        .select({
          id: brochures.id,
          name: brochures.name,
          brochureTypeId: brochures.brochureTypeId,
          customerId: brochures.customerId,
          createdBy: brochures.createdBy,
          createdAt: brochures.createdAt,
          updatedAt: brochures.updatedAt,
          brochureTypeName: brochureTypes.name,
          customerName: customers.name,
        })
        .from(brochures)
        .innerJoin(
          brochureTypes,
          eq(brochures.brochureTypeId, brochureTypes.id),
        )
        .leftJoin(customers, eq(brochures.customerId, customers.id))
        .where(whereClause)
        .orderBy(...this.getOrderBy(params))
        .limit(params.limit)
        .offset(getPaginationOffset(params)),
    ]);

    const statsByBrochureId = await this.getImageStatsByBrochureId(
      rows.map((row) => row.id),
    );

    const data = rows.map((row) => {
      const stats = statsByBrochureId.get(row.id) ?? {
        primaryImageUrl: null,
        imageCount: 0,
        packSizeCount: 0,
      };

      return {
        ...row,
        primaryImageUrl: stats.primaryImageUrl,
        imageCount: stats.imageCount,
        packSizeCount: stats.packSizeCount,
      } satisfies InventoryBrochureListItem;
    });

    return createPaginatedResult({
      data,
      page: params.page,
      limit: params.limit,
      total: countRows[0]?.total ?? 0,
    });
  }

  async getById(id: string) {
    const [brochure] = await db
      .select({
        id: brochures.id,
        name: brochures.name,
        brochureTypeId: brochures.brochureTypeId,
        customerId: brochures.customerId,
        createdBy: brochures.createdBy,
        createdAt: brochures.createdAt,
        updatedAt: brochures.updatedAt,
        brochureTypeName: brochureTypes.name,
        customerName: customers.name,
      })
      .from(brochures)
      .innerJoin(brochureTypes, eq(brochures.brochureTypeId, brochureTypes.id))
      .leftJoin(customers, eq(brochures.customerId, customers.id))
      .where(eq(brochures.id, id));

    if (!brochure) {
      throw new HttpError(404, 'Brochure not found', 'NOT_FOUND');
    }

    const images = await db
      .select()
      .from(brochureImages)
      .where(eq(brochureImages.brochureId, id))
      .orderBy(brochureImages.sortOrder, brochureImages.createdAt);

    const imageIds = images.map((image) => image.id);
    const packSizesByImageId = new Map<
      string,
      InventoryBrochurePackSizeWithUsage[]
    >();

    for (const imageId of imageIds) {
      packSizesByImageId.set(imageId, []);
    }

    if (imageIds.length > 0) {
      const packSizes = await db
        .select({
          id: brochureImagePackSizes.id,
          brochureImageId: brochureImagePackSizes.brochureImageId,
          unitsPerBox: brochureImagePackSizes.unitsPerBox,
          createdBy: brochureImagePackSizes.createdBy,
          createdAt: brochureImagePackSizes.createdAt,
          updatedAt: brochureImagePackSizes.updatedAt,
          inventoryItemCount: count(inventoryItems.id),
        })
        .from(brochureImagePackSizes)
        .leftJoin(
          inventoryItems,
          eq(inventoryItems.brochureImagePackSizeId, brochureImagePackSizes.id),
        )
        .where(inArray(brochureImagePackSizes.brochureImageId, imageIds))
        .groupBy(
          brochureImagePackSizes.id,
          brochureImagePackSizes.brochureImageId,
          brochureImagePackSizes.unitsPerBox,
          brochureImagePackSizes.createdBy,
          brochureImagePackSizes.createdAt,
          brochureImagePackSizes.updatedAt,
        )
        .orderBy(brochureImagePackSizes.unitsPerBox);

      for (const packSize of packSizes) {
        const imagePackSizes =
          packSizesByImageId.get(packSize.brochureImageId) ?? [];
        imagePackSizes.push(packSize);
        packSizesByImageId.set(packSize.brochureImageId, imagePackSizes);
      }
    }

    const imagesWithPackSizes = images.map((image) => ({
      ...image,
      packSizes: packSizesByImageId.get(image.id) ?? [],
    })) satisfies InventoryBrochureImageWithPackSizes[];

    const imageCount = imagesWithPackSizes.length;
    const packSizeCount = imagesWithPackSizes.reduce(
      (total, image) => total + image.packSizes.length,
      0,
    );

    return {
      ...brochure,
      primaryImageUrl: imagesWithPackSizes[0]?.imageUrl ?? null,
      imageCount,
      packSizeCount,
      images: imagesWithPackSizes,
    };
  }
}

export const inventoryBrochuresService = new InventoryBrochuresService();
