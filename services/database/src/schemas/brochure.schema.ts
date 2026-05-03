import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { userSchema } from './auth.schema';
import { customers } from './customer.schema';
import { inventoryItems } from './inventory.schema';

export const brochureTypes = pgTable('brochure_types', {
  id: uuid('id').primaryKey().defaultRandom(),

  name: varchar('name', { length: 255 }).notNull(),

  colSpan: integer('col_span').notNull().default(1),

  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

export const brochures = pgTable(
  'brochures',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    name: varchar('name', { length: 255 }).notNull(),

    brochureTypeId: uuid('brochure_type_id')
      .notNull()
      .references(() => brochureTypes.id),

    customerId: uuid('customer_id').references(() => customers.id, {
      onDelete: 'set null',
    }),

    createdBy: text('created_by').references(() => userSchema.id, {
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
    index('brochures_brochure_type_id_idx').on(table.brochureTypeId),
    index('brochures_customer_id_idx').on(table.customerId),
    index('brochures_name_idx').on(table.name),
  ],
);

export const brochureImages = pgTable(
  'brochure_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    brochureId: uuid('brochure_id')
      .notNull()
      .references(() => brochures.id, { onDelete: 'cascade' }),

    imageUrl: varchar('image_url', { length: 500 }),

    sortOrder: integer('sort_order').notNull().default(0),

    uploadedBy: text('uploaded_by').references(() => userSchema.id, {
      onDelete: 'set null',
    }),

    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('brochure_images_brochure_id_idx').on(table.brochureId)],
);

export const brochureImagePackSizes = pgTable(
  'brochure_image_pack_sizes',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    brochureImageId: uuid('brochure_image_id')
      .notNull()
      .references(() => brochureImages.id, { onDelete: 'cascade' }),

    unitsPerBox: numeric('units_per_box', {
      precision: 12,
      scale: 2,
      mode: 'number',
    }).notNull(),

    createdBy: text('created_by').references(() => userSchema.id, {
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
    unique('brochure_image_pack_sizes_image_units_unique').on(
      table.brochureImageId,
      table.unitsPerBox,
    ),
    index('brochure_image_pack_sizes_brochure_image_id_idx').on(
      table.brochureImageId,
    ),
    index('brochure_image_pack_sizes_units_per_box_idx').on(table.unitsPerBox),
  ],
);

export const brochuresRelations = relations(brochures, ({ one, many }) => ({
  brochureType: one(brochureTypes, {
    fields: [brochures.brochureTypeId],
    references: [brochureTypes.id],
  }),
  customer: one(customers, {
    fields: [brochures.customerId],
    references: [customers.id],
  }),
  createdByUser: one(userSchema, {
    fields: [brochures.createdBy],
    references: [userSchema.id],
  }),
  images: many(brochureImages),
}));

export const brochureImagesRelations = relations(
  brochureImages,
  ({ one, many }) => ({
    brochure: one(brochures, {
      fields: [brochureImages.brochureId],
      references: [brochures.id],
    }),
    uploadedByUser: one(userSchema, {
      fields: [brochureImages.uploadedBy],
      references: [userSchema.id],
    }),
    packSizes: many(brochureImagePackSizes),
  }),
);

export const brochureImagePackSizesRelations = relations(
  brochureImagePackSizes,
  ({ one, many }) => ({
    brochureImage: one(brochureImages, {
      fields: [brochureImagePackSizes.brochureImageId],
      references: [brochureImages.id],
    }),
    createdByUser: one(userSchema, {
      fields: [brochureImagePackSizes.createdBy],
      references: [userSchema.id],
    }),
    inventoryItems: many(inventoryItems),
  }),
);
