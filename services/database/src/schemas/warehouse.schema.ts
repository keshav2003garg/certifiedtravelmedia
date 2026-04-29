import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { sectors } from './sector.schema';

export const warehouses = pgTable(
  'warehouses',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    acumaticaId: varchar('acumatica_id', { length: 50 }).unique(),
    name: varchar('name', { length: 255 }).notNull(),
    address: text('address'),

    isActive: boolean('is_active').notNull().default(true),

    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('warehouses_acumatica_id_idx').on(table.acumaticaId)],
);

export const warehousesSectors = pgTable(
  'warehouses_sectors',
  {
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id, { onDelete: 'cascade' }),

    sectorId: uuid('sector_id')
      .notNull()
      .references(() => sectors.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.warehouseId, table.sectorId] }),
    index('warehouses_sectors_warehouse_id_idx').on(table.warehouseId),
    index('warehouses_sectors_sector_id_idx').on(table.sectorId),
  ],
);

export const warehousesRelations = relations(warehouses, ({ many }) => ({
  warehousesSectors: many(warehousesSectors),
}));

export const warehousesSectorsRelations = relations(
  warehousesSectors,
  ({ one }) => ({
    warehouse: one(warehouses, {
      fields: [warehousesSectors.warehouseId],
      references: [warehouses.id],
    }),
    sector: one(sectors, {
      fields: [warehousesSectors.sectorId],
      references: [sectors.id],
    }),
  }),
);
