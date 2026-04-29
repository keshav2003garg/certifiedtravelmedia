---
name: create_db_schema
description: Create standardized Drizzle ORM schemas with string literal enums, relations, indexes, checks, and type exports.
---

# Create Database Schema (Drizzle)

This skill guides you through creating a new database schema in `services/database/src/schemas/`.

**Location:** `services/database/src/schemas/<model>.schema.ts`

## 1. Enums (String Literals)

**CRITICAL:** Do NOT use TypeScript `enum`. Use `pgEnum` with a const array and derive a string union type.

```typescript
import { pgEnum } from 'drizzle-orm/pg-core';

// 1. Define values as a const array (export for reuse in validators)
export const ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;

// 2. Create the PostgreSQL Enum
export const orderStatusEnum = pgEnum('order_status', ORDER_STATUSES);

// 3. Export the TypeScript Type (String Union)
export type OrderStatus = (typeof ORDER_STATUSES)[number];
```

## 2. Table Definition

Follow these column type rules:

| Use Case                          | Column Type                           | Example                                                         |
| --------------------------------- | ------------------------------------- | --------------------------------------------------------------- |
| Primary key (auto-generated)      | `uuid().primaryKey().defaultRandom()` | `id`                                                            |
| Primary key (external, e.g. auth) | `text().primaryKey()`                 | `id` (from Better Auth)                                         |
| Short strings (name, title, etc.) | `varchar({ length: N })`              | `name: varchar('name', { length: 255 })`                        |
| Long text                         | `text()`                              | `description: text('description')`                              |
| Boolean                           | `boolean()`                           | `isActive: boolean('is_active')`                                |
| Integer                           | `integer()`                           | `quantity: integer('quantity')`                                 |
| Decimal/Money                     | `numeric({ precision, scale })`       | `salePrice: numeric('sale_price', { precision: 10, scale: 2 })` |
| Float                             | `real()`                              | `weight: real('weight')`                                        |
| Timestamps                        | `timestamp({ mode: 'string' })`       | `createdAt: timestamp('created_at', { mode: 'string' })`        |
| Date-only timestamps              | `timestamp({ mode: 'date' })`         | `expiresAt: timestamp('expires_at', { mode: 'date' })`          |
| Array                             | `text().array()`                      | `images: text('images').array().notNull().default([])`          |
| Enum                              | `myEnum()`                            | `status: orderStatusEnum('status')`                             |

```typescript
import {
  pgTable,
  text,
  varchar,
  timestamp,
  uuid,
  boolean,
  integer,
  numeric,
  real,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { userSchema } from './auth.schema';

export const productSchema = pgTable(
  'product',
  {
    // Primary key
    id: uuid('id').primaryKey().defaultRandom(),

    // String fields
    name: varchar('name', { length: 500 }).notNull(),
    slug: varchar('slug', { length: 500 }).notNull().unique(),
    description: text('description'),
    shortDescription: text('short_description'),
    sku: varchar('sku', { length: 100 }).unique(),
    barcode: varchar('barcode', { length: 100 }).unique(),

    // Numeric fields (use numeric for money, real for measurements)
    vat: numeric('vat', { precision: 5, scale: 2 }).notNull(),
    costPrice: numeric('cost_price', { precision: 10, scale: 2 }).notNull(),
    salePrice: numeric('sale_price', { precision: 10, scale: 2 }).notNull(),
    noOfUnits: integer('no_of_units').notNull(),
    weight: real('weight'),

    // Boolean fields
    isActive: boolean('is_active').notNull().default(true),
    hasVolumeDiscount: boolean('has_volume_discount').notNull().default(false),

    // Enum fields
    visibility: productVisibilityEnum('visibility').notNull().default('both'),
    pricingType: productPricingTypeEnum('pricing_type')
      .notNull()
      .default('unit'),

    // Array fields
    images: text('images').array().notNull().default([]),

    // Foreign keys
    createdBy: text('created_by').references(() => userSchema.id),

    // Soft delete
    deletedAt: timestamp('deleted_at', { mode: 'string' }),

    // Timestamps (ALWAYS include both)
    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // ─── Indexes for common query patterns ──────────────────────────
    index('product_name_idx').on(table.name),
    index('product_sale_price_idx').on(table.salePrice),
    index('product_created_at_idx').on(table.createdAt),
    // Composite index for common filter combination
    index('product_active_visibility_idx').on(table.isActive, table.visibility),
    index('product_barcode_idx').on(table.barcode),

    // ─── Check constraints for data integrity ───────────────────────
    check('product_sale_price_positive', sql`${table.salePrice} > 0`),
    check('product_vat_range', sql`${table.vat} >= 0 AND ${table.vat} <= 100`),
  ],
);
```

## 3. Self-Referencing Foreign Keys

For hierarchical data (categories, comments, etc.):

```typescript
export const categorySchema = pgTable(
  'category',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    // Self-reference with onDelete: 'set null'
    parentId: uuid('parent_id').references(() => categorySchema.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('category_slug_idx').on(table.slug),
    index('category_parent_id_idx').on(table.parentId),
  ],
);
```

## 4. Junction Tables (Many-to-Many)

```typescript
export const productCategorySchema = pgTable(
  'product_category',
  {
    productId: uuid('product_id')
      .notNull()
      .references(() => productSchema.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categorySchema.id, { onDelete: 'cascade' }),
  },
  (table) => [
    // Composite primary key alternative: use unique index
    index('product_category_idx').on(table.productId, table.categoryId),
  ],
);
```

## 5. Relations

Use `drizzle-orm`'s `relations` for query building (not for schema — no FK created):

```typescript
import { relations } from 'drizzle-orm';

export const productRelations = relations(productSchema, ({ one, many }) => ({
  categories: many(productCategorySchema),
  inventories: many(inventorySchema),
  createdByUser: one(userSchema, {
    fields: [productSchema.createdBy],
    references: [userSchema.id],
  }),
}));

export const categoryRelations = relations(categorySchema, ({ one, many }) => ({
  parent: one(categorySchema, {
    fields: [categorySchema.parentId],
    references: [categorySchema.id],
    relationName: 'parentChild',
  }),
  children: many(categorySchema, { relationName: 'parentChild' }),
  products: many(productCategorySchema),
}));
```

## 6. Type Exports

```typescript
export type ProductSchema = typeof productSchema.$inferSelect;
export type ProductInsert = typeof productSchema.$inferInsert;
export type CategorySchema = typeof categorySchema.$inferSelect;
export type CategoryInsert = typeof categorySchema.$inferInsert;
```

## Index Strategy Guide

| Query Pattern                       | Index Type            | Example                                        |
| ----------------------------------- | --------------------- | ---------------------------------------------- |
| Filter by single column             | Single column         | `index().on(table.status)`                     |
| Filter by multiple columns together | Composite             | `index().on(table.isActive, table.visibility)` |
| Unique constraint with lookup       | `.unique()` on column | `slug: varchar(...).unique()`                  |
| Text search (LIKE/ILIKE)            | Single column         | `index().on(table.name)`                       |
| Sort by column                      | Single column         | `index().on(table.createdAt)`                  |
| Foreign key (automatic in PG)       | Already indexed       | FK columns                                     |

## Common Mistakes to Avoid

1. **NEVER use TypeScript `enum`** — always use `pgEnum` with const array
2. **NEVER use `mode: 'date'` for createdAt/updatedAt** — use `mode: 'string'` (JSON serializable)
3. **NEVER forget `.notNull()` on required fields** — Drizzle defaults to nullable
4. **NEVER use `integer` for money** — use `numeric({ precision: 10, scale: 2 })`
5. **NEVER skip `deletedAt`** on any deleteable entity — always soft delete
6. **ALWAYS add `createdAt` + `updatedAt` timestamps** to every table
7. **ALWAYS add indexes** for columns used in WHERE clauses and JOIN conditions
8. **ALWAYS add check constraints** for business rules (positive prices, valid ranges)
9. **ALWAYS use `{ onDelete: 'cascade' }` on junction table FKs** — prevents orphans
10. **ALWAYS use `{ onDelete: 'set null' }` on optional FKs** — preserves parent when child is deleted
11. **Export const arrays** (like `ORDER_STATUSES`) for reuse in frontend validators
