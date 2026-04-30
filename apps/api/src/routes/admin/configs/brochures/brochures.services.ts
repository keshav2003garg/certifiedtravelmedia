import db from '@/db';

import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNull,
  ne,
  or,
  sql,
} from 'drizzle-orm';

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
import type { BrochureImagePackSize } from '@services/database/types';
import type {
  BrochureDetail,
  BrochureImageWithPackSizes,
  BrochureListItem,
  BrochurePackSizeWithUsage,
  CreateBrochureImageInput,
  CreateBrochureInput,
  CreateImagePackSizeInput,
  ListBrochuresParams,
  ListBrochuresResult,
  UpdateBrochureImageInput,
  UpdateBrochureInput,
  UpdateImagePackSizeInput,
} from './brochures.types';

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

function isDatabaseError(
  error: unknown,
): error is { code?: string; constraint?: string } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

function rethrowBrochureWriteError(error: unknown): never {
  if (isDatabaseError(error) && error.code === '23505') {
    if (error.constraint === 'brochure_image_pack_sizes_image_units_unique') {
      throw new HttpError(
        409,
        'This image already has a pack size with the same units per box',
        'CONFLICT',
      );
    }

    throw new HttpError(
      409,
      'A brochure record with these details already exists',
      'CONFLICT',
    );
  }

  if (isDatabaseError(error) && error.code === '23503') {
    throw new HttpError(
      409,
      'Related brochure data is in use or no longer exists',
      'CONFLICT',
    );
  }

  throw error;
}

class BrochuresService {
  private normalizeUnitsPerBox(value: number) {
    return Number(value.toFixed(2));
  }

  private async getBrochureOrThrow(id: string) {
    const brochure = await db.query.brochures.findFirst({
      where: eq(brochures.id, id),
    });

    if (!brochure) {
      throw new HttpError(404, 'Brochure not found', 'NOT_FOUND');
    }

    return brochure;
  }

  private async getBrochureImageOrThrow(brochureId: string, imageId: string) {
    const image = await db.query.brochureImages.findFirst({
      where: and(
        eq(brochureImages.id, imageId),
        eq(brochureImages.brochureId, brochureId),
      ),
    });

    if (!image) {
      throw new HttpError(404, 'Brochure image not found', 'NOT_FOUND');
    }

    return image;
  }

  private async getPackSizeOrThrow(imageId: string, packSizeId: string) {
    const packSize = await db.query.brochureImagePackSizes.findFirst({
      where: and(
        eq(brochureImagePackSizes.id, packSizeId),
        eq(brochureImagePackSizes.brochureImageId, imageId),
      ),
    });

    if (!packSize) {
      throw new HttpError(
        404,
        'Brochure image pack size not found',
        'NOT_FOUND',
      );
    }

    return packSize;
  }

  private async assertBrochureTypeExists(id: string) {
    const brochureType = await db.query.brochureTypes.findFirst({
      where: eq(brochureTypes.id, id),
    });

    if (!brochureType) {
      throw new HttpError(404, 'Brochure type not found', 'NOT_FOUND');
    }
  }

  private async assertCustomerExists(id: string | null | undefined) {
    if (!id) return;

    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, id),
    });

    if (!customer) {
      throw new HttpError(404, 'Customer not found', 'NOT_FOUND');
    }
  }

  private async assertNameAvailable(params: {
    name: string;
    brochureTypeId: string;
    customerId?: string | null;
    currentId?: string;
  }) {
    const conditions: SQL[] = [
      sql`LOWER(${brochures.name}) = ${params.name.toLowerCase()}`,
      eq(brochures.brochureTypeId, params.brochureTypeId),
      params.customerId
        ? eq(brochures.customerId, params.customerId)
        : isNull(brochures.customerId),
    ];

    if (params.currentId) {
      conditions.push(ne(brochures.id, params.currentId));
    }

    const existing = await db.query.brochures.findFirst({
      where: and(...conditions),
    });

    if (existing) {
      throw new HttpError(
        409,
        'A brochure with this name, type, and customer already exists',
        'CONFLICT',
      );
    }
  }

  private async assertPackSizeAvailable(
    imageId: string,
    unitsPerBox: number,
    currentId?: string,
  ) {
    const conditions: SQL[] = [
      eq(brochureImagePackSizes.brochureImageId, imageId),
      eq(brochureImagePackSizes.unitsPerBox, unitsPerBox),
    ];

    if (currentId) {
      conditions.push(ne(brochureImagePackSizes.id, currentId));
    }

    const existing = await db.query.brochureImagePackSizes.findFirst({
      where: and(...conditions),
    });

    if (existing) {
      throw new HttpError(
        409,
        'This image already has a pack size with the same units per box',
        'CONFLICT',
      );
    }
  }

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

  private buildWhereClause(params: ListBrochuresParams) {
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

  private getOrderBy(params: ListBrochuresParams) {
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

  private async getInventoryCountForPackSize(id: string) {
    const [row] = await db
      .select({ total: count() })
      .from(inventoryItems)
      .where(eq(inventoryItems.brochureImagePackSizeId, id));

    return row?.total ?? 0;
  }

  private async getInventoryCountForImageIds(ids: string[]) {
    if (ids.length === 0) return 0;

    const [row] = await db
      .select({ total: count(inventoryItems.id) })
      .from(inventoryItems)
      .innerJoin(
        brochureImagePackSizes,
        eq(inventoryItems.brochureImagePackSizeId, brochureImagePackSizes.id),
      )
      .where(inArray(brochureImagePackSizes.brochureImageId, ids));

    return row?.total ?? 0;
  }

  private withPackSizeUsage(
    packSize: BrochureImagePackSize,
    inventoryItemCount: number,
  ): BrochurePackSizeWithUsage {
    return {
      ...packSize,
      inventoryItemCount,
    };
  }

  async list(params: ListBrochuresParams): Promise<ListBrochuresResult> {
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
      } satisfies BrochureListItem;
    });

    return createPaginatedResult({
      data,
      page: params.page,
      limit: params.limit,
      total: countRows[0]?.total ?? 0,
    });
  }

  async getById(id: string): Promise<BrochureDetail> {
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
    const packSizesByImageId = new Map<string, BrochurePackSizeWithUsage[]>();

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
    })) satisfies BrochureImageWithPackSizes[];

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

  async create(values: CreateBrochureInput, userId: string) {
    await this.assertBrochureTypeExists(values.brochureTypeId);
    await this.assertCustomerExists(values.customerId);
    await this.assertNameAvailable({
      name: values.name,
      brochureTypeId: values.brochureTypeId,
      customerId: values.customerId,
    });

    try {
      const brochure = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(brochures)
          .values({
            name: values.name,
            brochureTypeId: values.brochureTypeId,
            customerId: values.customerId ?? null,
            createdBy: userId,
          })
          .returning();

        if (!created) {
          throw new HttpError(
            500,
            'Failed to create brochure',
            'INTERNAL_SERVER',
          );
        }

        if (values.image) {
          const [image] = await tx
            .insert(brochureImages)
            .values({
              brochureId: created.id,
              imageUrl: values.image.imageUrl,
              sortOrder: values.image.sortOrder ?? 0,
              uploadedBy: userId,
            })
            .returning();

          if (!image) {
            throw new HttpError(
              500,
              'Failed to create brochure image',
              'INTERNAL_SERVER',
            );
          }

          if (values.image.packSizes.length > 0) {
            await tx.insert(brochureImagePackSizes).values(
              values.image.packSizes.map((packSize) => ({
                brochureImageId: image.id,
                unitsPerBox: this.normalizeUnitsPerBox(packSize.unitsPerBox),
                createdBy: userId,
              })),
            );
          }
        }

        return created;
      });

      return this.getById(brochure.id);
    } catch (error) {
      rethrowBrochureWriteError(error);
    }
  }

  async update(id: string, values: UpdateBrochureInput) {
    const existing = await this.getBrochureOrThrow(id);
    const brochureTypeId = values.brochureTypeId ?? existing.brochureTypeId;
    const customerId =
      values.customerId !== undefined ? values.customerId : existing.customerId;
    const name = values.name ?? existing.name;

    if (values.brochureTypeId) {
      await this.assertBrochureTypeExists(values.brochureTypeId);
    }

    if (values.customerId !== undefined) {
      await this.assertCustomerExists(values.customerId);
    }

    await this.assertNameAvailable({
      name,
      brochureTypeId,
      customerId,
      currentId: id,
    });

    try {
      const [updated] = await db
        .update(brochures)
        .set({
          ...(values.name !== undefined && { name: values.name }),
          ...(values.brochureTypeId !== undefined && {
            brochureTypeId: values.brochureTypeId,
          }),
          ...(values.customerId !== undefined && {
            customerId: values.customerId,
          }),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(brochures.id, id))
        .returning();

      if (!updated) {
        throw new HttpError(
          500,
          'Failed to update brochure',
          'INTERNAL_SERVER',
        );
      }

      return this.getById(id);
    } catch (error) {
      rethrowBrochureWriteError(error);
    }
  }

  async delete(id: string) {
    const brochure = await this.getById(id);
    const imageIds = brochure.images.map((image) => image.id);
    const inventoryItemCount =
      await this.getInventoryCountForImageIds(imageIds);

    if (inventoryItemCount > 0) {
      throw new HttpError(
        409,
        'Brochures with inventory-linked pack sizes cannot be deleted',
        'CONFLICT',
      );
    }

    try {
      await db.transaction(async (tx) => {
        if (imageIds.length > 0) {
          await tx
            .delete(brochureImagePackSizes)
            .where(inArray(brochureImagePackSizes.brochureImageId, imageIds));
        }

        await tx
          .delete(brochureImages)
          .where(eq(brochureImages.brochureId, id));

        const [deleted] = await tx
          .delete(brochures)
          .where(eq(brochures.id, id))
          .returning();

        if (!deleted) {
          throw new HttpError(
            500,
            'Failed to delete brochure',
            'INTERNAL_SERVER',
          );
        }
      });

      return brochure;
    } catch (error) {
      rethrowBrochureWriteError(error);
    }
  }

  async createImage(
    brochureId: string,
    values: CreateBrochureImageInput,
    userId: string,
  ) {
    await this.getBrochureOrThrow(brochureId);

    try {
      const image = await db.transaction(async (tx) => {
        const sortOrder =
          values.sortOrder ??
          (
            await tx
              .select({
                nextSortOrder:
                  sql<number>`COALESCE(MAX(${brochureImages.sortOrder}), -1) + 1`.mapWith(
                    Number,
                  ),
              })
              .from(brochureImages)
              .where(eq(brochureImages.brochureId, brochureId))
          )[0]?.nextSortOrder ??
          0;

        const [created] = await tx
          .insert(brochureImages)
          .values({
            brochureId,
            imageUrl: values.imageUrl,
            sortOrder,
            uploadedBy: userId,
          })
          .returning();

        if (!created) {
          throw new HttpError(
            500,
            'Failed to create brochure image',
            'INTERNAL_SERVER',
          );
        }

        if (values.packSizes.length > 0) {
          await tx.insert(brochureImagePackSizes).values(
            values.packSizes.map((packSize) => ({
              brochureImageId: created.id,
              unitsPerBox: this.normalizeUnitsPerBox(packSize.unitsPerBox),
              createdBy: userId,
            })),
          );
        }

        return created;
      });

      return this.getById(image.brochureId);
    } catch (error) {
      rethrowBrochureWriteError(error);
    }
  }

  async updateImage(
    brochureId: string,
    imageId: string,
    values: UpdateBrochureImageInput,
  ) {
    await this.getBrochureImageOrThrow(brochureId, imageId);

    try {
      const [updated] = await db
        .update(brochureImages)
        .set({
          ...(values.imageUrl !== undefined && { imageUrl: values.imageUrl }),
          ...(values.sortOrder !== undefined && {
            sortOrder: values.sortOrder,
          }),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(brochureImages.id, imageId))
        .returning();

      if (!updated) {
        throw new HttpError(
          500,
          'Failed to update brochure image',
          'INTERNAL_SERVER',
        );
      }

      return this.getById(brochureId);
    } catch (error) {
      rethrowBrochureWriteError(error);
    }
  }

  async deleteImage(brochureId: string, imageId: string) {
    await this.getBrochureImageOrThrow(brochureId, imageId);

    const inventoryItemCount = await this.getInventoryCountForImageIds([
      imageId,
    ]);

    if (inventoryItemCount > 0) {
      throw new HttpError(
        409,
        'Images with inventory-linked pack sizes cannot be deleted',
        'CONFLICT',
      );
    }

    try {
      await db.transaction(async (tx) => {
        await tx
          .delete(brochureImagePackSizes)
          .where(eq(brochureImagePackSizes.brochureImageId, imageId));

        const [deleted] = await tx
          .delete(brochureImages)
          .where(
            and(
              eq(brochureImages.id, imageId),
              eq(brochureImages.brochureId, brochureId),
            ),
          )
          .returning();

        if (!deleted) {
          throw new HttpError(
            500,
            'Failed to delete brochure image',
            'INTERNAL_SERVER',
          );
        }
      });

      return this.getById(brochureId);
    } catch (error) {
      rethrowBrochureWriteError(error);
    }
  }

  async createImagePackSize(
    brochureId: string,
    imageId: string,
    values: CreateImagePackSizeInput,
    userId: string,
  ) {
    await this.getBrochureImageOrThrow(brochureId, imageId);

    const unitsPerBox = this.normalizeUnitsPerBox(values.unitsPerBox);
    await this.assertPackSizeAvailable(imageId, unitsPerBox);

    try {
      const [packSize] = await db
        .insert(brochureImagePackSizes)
        .values({
          brochureImageId: imageId,
          unitsPerBox,
          createdBy: userId,
        })
        .returning();

      if (!packSize) {
        throw new HttpError(
          500,
          'Failed to create image pack size',
          'INTERNAL_SERVER',
        );
      }

      return this.withPackSizeUsage(packSize, 0);
    } catch (error) {
      rethrowBrochureWriteError(error);
    }
  }

  async updateImagePackSize(
    brochureId: string,
    imageId: string,
    packSizeId: string,
    values: UpdateImagePackSizeInput,
  ) {
    await this.getBrochureImageOrThrow(brochureId, imageId);
    const packSize = await this.getPackSizeOrThrow(imageId, packSizeId);
    const unitsPerBox = this.normalizeUnitsPerBox(values.unitsPerBox);
    const inventoryItemCount = await this.getInventoryCountForPackSize(
      packSize.id,
    );

    if (packSize.unitsPerBox === unitsPerBox) {
      return this.withPackSizeUsage(packSize, inventoryItemCount);
    }

    if (inventoryItemCount > 0) {
      throw new HttpError(
        409,
        'Pack sizes used by inventory cannot be changed. Create a new pack size instead.',
        'CONFLICT',
      );
    }

    await this.assertPackSizeAvailable(imageId, unitsPerBox, packSizeId);

    try {
      const [updated] = await db
        .update(brochureImagePackSizes)
        .set({
          unitsPerBox,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(brochureImagePackSizes.id, packSizeId))
        .returning();

      if (!updated) {
        throw new HttpError(
          500,
          'Failed to update image pack size',
          'INTERNAL_SERVER',
        );
      }

      return this.withPackSizeUsage(updated, 0);
    } catch (error) {
      rethrowBrochureWriteError(error);
    }
  }

  async deleteImagePackSize(
    brochureId: string,
    imageId: string,
    packSizeId: string,
  ) {
    await this.getBrochureImageOrThrow(brochureId, imageId);
    const packSize = await this.getPackSizeOrThrow(imageId, packSizeId);
    const inventoryItemCount = await this.getInventoryCountForPackSize(
      packSize.id,
    );

    if (inventoryItemCount > 0) {
      throw new HttpError(
        409,
        'Pack sizes used by inventory cannot be deleted',
        'CONFLICT',
      );
    }

    try {
      const [deleted] = await db
        .delete(brochureImagePackSizes)
        .where(eq(brochureImagePackSizes.id, packSizeId))
        .returning();

      if (!deleted) {
        throw new HttpError(
          500,
          'Failed to delete image pack size',
          'INTERNAL_SERVER',
        );
      }

      return this.withPackSizeUsage(deleted, 0);
    } catch (error) {
      rethrowBrochureWriteError(error);
    }
  }
}

export const brochuresService = new BrochuresService();
