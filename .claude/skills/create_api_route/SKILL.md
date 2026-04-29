---
name: create_api_route
description: Create a new API route following the 5-file pattern (Validators, Types, Services, Handlers, Routes) with admin/user sub-folder nesting.
---

# Create New API Route

This skill guides you through creating a new API route in `apps/api/src/routes/`.

## 1. Directory Structure

Features that serve both admin and user audiences use sub-folders:

```
apps/api/src/routes/<feature>/
├── <feature>.routes.ts              # Main router (mounts admin + user sub-routes)
├── admin/
│   ├── <feature>.validators.ts      # Admin-specific validators
│   ├── <feature>.types.ts           # Admin-specific types
│   ├── <feature>.services.ts        # Admin business logic (full CRUD)
│   ├── <feature>.handlers.ts        # Admin request handlers
│   └── <feature>.routes.ts          # Admin route definitions
└── user/
    ├── <feature>.validators.ts      # User/customer validators
    ├── <feature>.types.ts           # User-specific types
    ├── <feature>.services.ts        # User business logic (read-only, filtered)
    ├── <feature>.handlers.ts        # User request handlers
    └── <feature>.routes.ts          # User route definitions
```

For simple features without admin/user split, use a flat structure:

```
apps/api/src/routes/<feature>/
├── <feature>.validators.ts
├── <feature>.types.ts
├── <feature>.services.ts
├── <feature>.handlers.ts
└── <feature>.routes.ts
```

## 2. Main Router (Mounting Sub-Routes)

```typescript
// apps/api/src/routes/<feature>/<feature>.routes.ts
import { Hono } from 'hono';
import type { AppBindings } from '@repo/server-utils/types/app.types';
import adminFeature from './admin/<feature>.routes';
import userFeature from './user/<feature>.routes';

const feature = new Hono<AppBindings>();

// Mount both sub-routes at root — each has its own middleware
feature.route('/', adminFeature);
feature.route('/', userFeature);

export default feature;
```

## 3. Validators

**Imports — use shared validators from `@repo/server-utils`:**

```typescript
import z from 'zod/v4';
import { createValidatorSchema } from '@repo/server-utils/validator/zod-validator-schema';
import { paginationSchema } from '@repo/server-utils/validator/pagination.validator';
import {
  idParamSchema,
  slugParamSchema,
} from '@repo/server-utils/validator/params.validator';
import { booleanQueryParam } from '@repo/server-utils/validator/filters.validator';
import { createSortSchema } from '@repo/server-utils/validator/sorting.validators';
import {
  dateRangeSchema,
  dateRangeRefine,
  createDateRangeTransform,
} from '@repo/server-utils/validator/date.validator';
import type { TypedContext } from '@repo/server-utils/types/app.types';
```

### Pattern A: List with Pagination + Sort + Filters

```typescript
// Define sort schema from allowed fields
const featureSortSchema = createSortSchema([
  'name',
  'salePrice',
  'createdAt',
  'updatedAt',
]);

export const listFeaturesValidator = createValidatorSchema({
  query: paginationSchema
    .extend(featureSortSchema.shape) // Merge sortBy + order into query
    .extend({
      search: z.string().optional(),
      // Use booleanQueryParam for boolean query strings ('true'/'false')
      isActive: booleanQueryParam.optional(),
      // Use z.enum for constrained string values
      status: z.enum(['pending', 'approved', 'rejected']).optional(),
      // Comma-separated IDs → array transform
      categoryIds: z
        .string()
        .optional()
        .transform((val) => val?.split(',').filter(Boolean)),
      includeDeleted: booleanQueryParam.optional(),
    }),
});
export type ListFeaturesContext = TypedContext<typeof listFeaturesValidator>;
```

### Pattern B: Detail by ID (with optional query flags)

```typescript
export const getFeatureValidator = createValidatorSchema({
  param: idParamSchema,
  query: z.object({ includeDeleted: booleanQueryParam.optional() }),
});
export type GetFeatureContext = TypedContext<typeof getFeatureValidator>;
```

### Pattern C: Detail by Slug

```typescript
export const getFeatureBySlugValidator = createValidatorSchema({
  param: slugParamSchema,
});
export type GetFeatureBySlugContext = TypedContext<
  typeof getFeatureBySlugValidator
>;
```

### Pattern D: Create with Conditional Validation (superRefine)

```typescript
export const createFeatureValidator = createValidatorSchema({
  json: z
    .object({
      name: z.string().min(1).max(500),
      description: z.string().max(5000).optional(),
      salePrice: z.number().gt(0),
      vat: z.number().min(0).max(100),
      pricingType: z.enum(['unit', 'weight']),
      pricePerKg: z.number().min(0).optional(),
      // Array with uniqueness validation
      categoryIds: z
        .array(z.uuid())
        .default([])
        .refine((ids) => new Set(ids).size === ids.length, {
          message: 'Duplicate category IDs not allowed',
        }),
    })
    .superRefine((data, ctx) => {
      // Conditional required field validation
      if (data.pricingType === 'weight' && data.pricePerKg === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['pricePerKg'],
          message: 'pricePerKg is required for weight pricing',
        });
      }
    }),
});
export type CreateFeatureContext = TypedContext<typeof createFeatureValidator>;
```

### Pattern E: Update (Partial of Create)

```typescript
export const updateFeatureValidator = createValidatorSchema({
  param: idParamSchema,
  json: createFeatureValidator.json.partial(), // All fields optional
});
export type UpdateFeatureContext = TypedContext<typeof updateFeatureValidator>;
```

### Pattern F: Date Range Query (for analytics)

```typescript
export const getFeatureGraphValidator = createValidatorSchema({
  query: dateRangeSchema
    .superRefine(dateRangeRefine)
    .transform(createDateRangeTransform(30)), // Default 30-day lookback
});
export type GetFeatureGraphContext = TypedContext<
  typeof getFeatureGraphValidator
>;
```

## 4. Types (Inferred from Validators)

**CRITICAL:** Prefer inferring from validators. Only define manual interfaces for complex response shapes.

```typescript
import { z } from 'zod/v4';
import type {
  listFeaturesValidator,
  createFeatureValidator,
  updateFeatureValidator,
} from './<feature>.validators';

// Infer from validators
export type ListFeaturesParams = z.infer<typeof listFeaturesValidator.query>;

// Extract filters by omitting pagination + sort fields
export type ListFeaturesFilters = Omit<
  ListFeaturesParams,
  'page' | 'pageSize' | 'sortBy' | 'order'
>;

export type CreateFeatureInput = z.infer<typeof createFeatureValidator.json>;
export type UpdateFeatureInput = z.infer<typeof updateFeatureValidator.json>;

// Manual interface only for complex joined/computed response shapes
export interface FeatureDetail extends FeatureSchema {
  categories: CategorySchema[];
  totalStock: number;
  inventories: InventorySchema[];
  activeDiscount: { id: string; percentage: number } | null;
}
```

## 5. Service

**Architecture Rules:**

- Singleton class exported as `const featureService = new FeatureService()`
- All DB queries happen here — handlers NEVER touch `db` directly
- Throw `HttpError` for business errors (404, 409, etc.)
- Use `db.transaction()` for multi-table writes
- Use `Promise.all()` for parallel independent queries
- Soft delete: set `deletedAt` + `isActive = false`, never hard delete

```typescript
import db from '@/db';
import {
  eq,
  and,
  or,
  count,
  ilike,
  inArray,
  isNull,
  asc,
  desc,
  sql,
  type SQL,
} from 'drizzle-orm';
import HttpError from '@repo/server-utils/errors/http-error';
import { buildPaginationResponse } from '@repo/server-utils/utils/pagination';
import type { PaginationParams } from '@repo/server-utils/types/util.types';
import type {
  ListFeaturesFilters,
  CreateFeatureInput,
  UpdateFeatureInput,
} from './<feature>.types';

class FeatureService {
  // ─── List with Pagination + Filtering + Sorting ─────────────────────
  async list(
    pagination: PaginationParams,
    filters: ListFeaturesFilters,
    sortBy?: string,
    order?: string,
  ) {
    const { page, pageSize } = pagination;
    const offset = (page - 1) * pageSize;

    // Build conditions array dynamically
    const conditions: SQL[] = [];

    // Always exclude soft-deleted unless explicitly requested
    if (!filters.includeDeleted) {
      conditions.push(isNull(featureSchema.deletedAt));
    }

    // Multi-field search with LIKE (escape user input!)
    if (filters.search) {
      const escaped = this.escapeLike(filters.search);
      conditions.push(
        or(
          ilike(featureSchema.name, `%${escaped}%`),
          ilike(featureSchema.sku, `%${escaped}%`),
        )!,
      );
    }

    // Boolean filter
    if (filters.isActive !== undefined) {
      conditions.push(eq(featureSchema.isActive, filters.isActive));
    }

    // Enum filter
    if (filters.status) {
      conditions.push(eq(featureSchema.status, filters.status));
    }

    // Array filter via subquery (many-to-many)
    if (filters.categoryIds?.length) {
      conditions.push(
        inArray(
          featureSchema.id,
          db
            .select({ featureId: featureCategorySchema.featureId })
            .from(featureCategorySchema)
            .where(
              inArray(featureCategorySchema.categoryId, filters.categoryIds),
            ),
        ),
      );
    }

    const finalWhere = conditions.length > 0 ? and(...conditions) : undefined;

    // Parallel count + data fetch
    const [totalResult, items] = await Promise.all([
      db.select({ count: count() }).from(featureSchema).where(finalWhere),
      db
        .select()
        .from(featureSchema)
        .where(finalWhere)
        .orderBy(this.getOrderBy(sortBy, order))
        .limit(pageSize)
        .offset(offset),
    ]);

    const total = totalResult[0]?.count ?? 0;

    return {
      items,
      pagination: buildPaginationResponse(page, pageSize, total),
    };
  }

  // ─── Find By ID ────────────────────────────────────────────────────
  async findById(id: string, includeDeleted = false) {
    const conditions: SQL[] = [eq(featureSchema.id, id)];
    if (!includeDeleted) {
      conditions.push(isNull(featureSchema.deletedAt));
    }

    const [item] = await db
      .select()
      .from(featureSchema)
      .where(and(...conditions));

    if (!item) {
      throw new HttpError(404, 'Resource not found', 'NOT_FOUND');
    }

    // Fetch related data in parallel
    const [categories, inventories] = await Promise.all([
      db
        .select()
        .from(categorySchema)
        .innerJoin(
          featureCategorySchema,
          eq(categorySchema.id, featureCategorySchema.categoryId),
        )
        .where(eq(featureCategorySchema.featureId, id)),
      db
        .select()
        .from(inventorySchema)
        .where(eq(inventorySchema.featureId, id)),
    ]);

    // Compute derived fields
    const totalStock = inventories.reduce((sum, inv) => sum + inv.quantity, 0);

    return { item: { ...item, categories, inventories, totalStock } };
  }

  // ─── Create (with Transaction) ─────────────────────────────────────
  async create(data: CreateFeatureInput) {
    const { categoryIds, ...featureData } = data;
    const slug = this.generateSlug(featureData.name);

    return db.transaction(async (tx) => {
      const [item] = await tx
        .insert(featureSchema)
        .values({ ...featureData, slug })
        .returning()
        .catch((err) => {
          this.handleUniqueConstraintError(err);
          throw err;
        });

      if (categoryIds.length > 0) {
        await tx
          .insert(featureCategorySchema)
          .values(
            categoryIds.map((categoryId) => ({
              featureId: item.id,
              categoryId,
            })),
          );
      }

      return { item };
    });
  }

  // ─── Update (with Transaction) ─────────────────────────────────────
  async update(id: string, data: UpdateFeatureInput) {
    return db.transaction(async (tx) => {
      const [item] = await tx
        .update(featureSchema)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(and(eq(featureSchema.id, id), isNull(featureSchema.deletedAt)))
        .returning()
        .catch((err) => {
          this.handleUniqueConstraintError(err);
          throw err;
        });

      if (!item) throw new HttpError(404, 'Resource not found', 'NOT_FOUND');

      return { item };
    });
  }

  // ─── Soft Delete ───────────────────────────────────────────────────
  async softDelete(id: string) {
    const now = new Date().toISOString();
    const [item] = await db
      .update(featureSchema)
      .set({ deletedAt: now, isActive: false, updatedAt: now })
      .where(and(eq(featureSchema.id, id), isNull(featureSchema.deletedAt)))
      .returning();

    if (!item) throw new HttpError(404, 'Resource not found', 'NOT_FOUND');
    return { item };
  }

  // ─── Private Helpers ───────────────────────────────────────────────

  /** Escape LIKE special characters to prevent SQL injection in search */
  private escapeLike(str: string): string {
    return str.replace(/[%_\\]/g, '\\$&');
  }

  /** Dynamic sort with fallback to createdAt desc */
  private getOrderBy(sortBy?: string, order?: string) {
    const direction = order === 'asc' ? asc : desc;
    switch (sortBy) {
      case 'name':
        return direction(featureSchema.name);
      case 'salePrice':
        return direction(featureSchema.salePrice);
      case 'createdAt':
        return direction(featureSchema.createdAt);
      default:
        return desc(featureSchema.createdAt);
    }
  }

  /** Convert unique constraint violations to friendly HttpError */
  private handleUniqueConstraintError(err: unknown): void {
    if (err instanceof Error && (err as { code: string }).code === '23505') {
      const detail = (err as { detail: string }).detail;
      let field = 'value';
      if (detail.includes('sku')) field = 'SKU';
      else if (detail.includes('barcode')) field = 'barcode';
      else if (detail.includes('slug')) field = 'slug';
      throw new HttpError(
        409,
        `A resource with this ${field} already exists`,
        'CONFLICT',
      );
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

export const featureService = new FeatureService();
```

## 6. Handlers

**Rules:** Thin handlers — extract validated data, call service, return response.

```typescript
import sendResponse from '@repo/server-utils/utils/response';
import { featureService } from './<feature>.services';
import type {
  ListFeaturesContext,
  GetFeatureContext,
  CreateFeatureContext,
  UpdateFeatureContext,
} from './<feature>.validators';

export async function listFeaturesHandler(ctx: ListFeaturesContext) {
  const { page, pageSize, sortBy, order, ...filters } = ctx.req.valid('query');
  const result = await featureService.list(
    { page, pageSize },
    filters,
    sortBy,
    order,
  );
  return sendResponse(ctx, 200, 'Resources retrieved', result);
}

export async function getFeatureHandler(ctx: GetFeatureContext) {
  const { id } = ctx.req.valid('param');
  const { includeDeleted } = ctx.req.valid('query');
  const result = await featureService.findById(id, includeDeleted);
  return sendResponse(ctx, 200, 'Resource retrieved', result);
}

export async function createFeatureHandler(ctx: CreateFeatureContext) {
  const body = ctx.req.valid('json');
  const result = await featureService.create(body);
  return sendResponse(ctx, 201, 'Resource created', result);
}

export async function updateFeatureHandler(ctx: UpdateFeatureContext) {
  const { id } = ctx.req.valid('param');
  const body = ctx.req.valid('json');
  const result = await featureService.update(id, body);
  return sendResponse(ctx, 200, 'Resource updated', result);
}

export async function deleteFeatureHandler(ctx: GetFeatureContext) {
  const { id } = ctx.req.valid('param');
  const result = await featureService.softDelete(id);
  return sendResponse(ctx, 200, 'Resource deleted', result);
}
```

## 7. Route Definitions

```typescript
// apps/api/src/routes/<feature>/admin/<feature>.routes.ts
import { Hono } from 'hono';
import { isAdmin } from '@repo/server-utils/middlewares/auth.middleware';
import { validator } from '@repo/server-utils/middlewares/validator.middleware';
import type { AppBindings } from '@repo/server-utils/types/app.types';
import * as handlers from './<feature>.handlers';
import * as validators from './<feature>.validators';

const adminFeature = new Hono<AppBindings>();

// Apply admin middleware to all routes
adminFeature.use('/*', isAdmin);

adminFeature.get(
  '/',
  validator(validators.listFeaturesValidator),
  handlers.listFeaturesHandler,
);
adminFeature.get(
  '/:id',
  validator(validators.getFeatureValidator),
  handlers.getFeatureHandler,
);
adminFeature.post(
  '/',
  validator(validators.createFeatureValidator),
  handlers.createFeatureHandler,
);
adminFeature.put(
  '/:id',
  validator(validators.updateFeatureValidator),
  handlers.updateFeatureHandler,
);
adminFeature.delete(
  '/:id',
  validator(validators.getFeatureValidator),
  handlers.deleteFeatureHandler,
);

export default adminFeature;
```

## 8. Register in App

```typescript
// apps/api/src/app.ts
import feature from './routes/<feature>/<feature>.routes';
app.route('/<feature>', feature);
```

## Common Mistakes to Avoid

1. **NEVER hard delete** — always soft delete with `deletedAt` timestamp
2. **NEVER use raw user input in LIKE** — always call `escapeLike()` first
3. **NEVER forget `isNull(schema.deletedAt)`** in list/detail queries (unless `includeDeleted` is true)
4. **NEVER do sequential DB queries** when they're independent — use `Promise.all()`
5. **NEVER put DB logic in handlers** — always delegate to service methods
6. **NEVER forget to reset `updatedAt`** on update/delete operations
7. **ALWAYS use transactions** for multi-table inserts/updates
8. **ALWAYS handle unique constraint errors** with `handleUniqueConstraintError` helper
9. **ALWAYS use `buildPaginationResponse()`** for consistent pagination metadata
10. **ALWAYS import validators/middleware from `@repo/server-utils/...`** not local `@/` paths

**Example (app.ts):**

```typescript
import <feature_name> from '@/routes/<feature_name>/<feature_name>.routes';

// ...
app.route('/api/<feature_name>', <feature_name>);
```
