import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { userSchema } from './auth.schema';
import { contracts } from './contract.schema';
import { inventoryItems } from './inventory.schema';
import { sectors } from './sector.schema';

export const chartStatusEnum = pgEnum('chart_status', [
  'Draft',
  'Completed',
  'Archived',
]);

export const tileTypeEnum = pgEnum('tile_type', ['Paid', 'Filler']);

export const chartLayouts = pgTable(
  'chart_layouts',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    sectorId: uuid('sector_id')
      .notNull()
      .references(() => sectors.id),

    standWidth: integer('stand_width').notNull(),
    standHeight: integer('stand_height').notNull(),

    month: integer('month').notNull(),
    year: integer('year').notNull(),

    status: chartStatusEnum('status').notNull().default('Draft'),

    generalNotes: text('general_notes'),

    locked: boolean('locked').notNull().default(false),

    completedAt: timestamp('completed_at', { mode: 'string' }),
    completedBy: text('completed_by').references(() => userSchema.id),

    archivedAt: timestamp('archived_at', { mode: 'string' }),
    archivedBy: text('archived_by').references(() => userSchema.id),

    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('chart_layouts_sector_size_month_year_unique').on(
      table.sectorId,
      table.standWidth,
      table.standHeight,
      table.month,
      table.year,
    ),
    index('chart_layouts_sector_size_idx').on(
      table.sectorId,
      table.standWidth,
      table.standHeight,
    ),
    index('chart_layouts_sector_id_idx').on(table.sectorId),
    index('chart_layouts_status_idx').on(table.status),
    index('chart_layouts_archived_at_idx').on(table.archivedAt),
    index('chart_layouts_month_year_idx').on(table.month, table.year),
  ],
);

export const chartTiles = pgTable(
  'chart_tiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    chartLayoutId: uuid('chart_layout_id')
      .notNull()
      .references(() => chartLayouts.id, { onDelete: 'cascade' }),

    col: integer('col').notNull(),
    row: integer('row').notNull(),
    colSpan: integer('col_span').notNull().default(1),

    tileType: tileTypeEnum('tile_type').notNull(),

    contractId: uuid('contract_id').references(() => contracts.id),
    inventoryItemId: uuid('inventory_item_id').references(
      () => inventoryItems.id,
    ),

    label: varchar('label', { length: 255 }),

    coverPhotoUrl: varchar('cover_photo_url', { length: 500 }),

    isNew: boolean('is_new').notNull().default(false),

    isFlagged: boolean('is_flagged').notNull().default(false),
    flagNote: text('flag_note'),

    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('chart_tiles_layout_id_idx').on(table.chartLayoutId)],
);

export const chartLayoutsRelations = relations(
  chartLayouts,
  ({ one, many }) => ({
    sector: one(sectors, {
      fields: [chartLayouts.sectorId],
      references: [sectors.id],
    }),
    completedByUser: one(userSchema, {
      fields: [chartLayouts.completedBy],
      references: [userSchema.id],
    }),
    tiles: many(chartTiles),
  }),
);

export const chartTilesRelations = relations(chartTiles, ({ one }) => ({
  chartLayout: one(chartLayouts, {
    fields: [chartTiles.chartLayoutId],
    references: [chartLayouts.id],
  }),
  inventoryItem: one(inventoryItems, {
    fields: [chartTiles.inventoryItemId],
    references: [inventoryItems.id],
  }),
  contract: one(contracts, {
    fields: [chartTiles.contractId],
    references: [contracts.id],
  }),
}));
