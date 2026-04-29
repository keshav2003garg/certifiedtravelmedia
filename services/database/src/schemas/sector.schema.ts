import { relations } from 'drizzle-orm';
import { index, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';

import { contractDistributions } from './contract.schema';
import { locationsSectors } from './location.schema';
import { warehousesSectors } from './warehouse.schema';

export const sectors = pgTable(
  'sectors',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    acumaticaId: varchar('acumatica_id', { length: 50 }).notNull().unique(),

    description: text('description').notNull(),
  },
  (table) => [index('sectors_acumatica_id_idx').on(table.acumaticaId)],
);

export const sectorsRelations = relations(sectors, ({ many }) => ({
  distributions: many(contractDistributions),
  locationsSectors: many(locationsSectors),
  warehousesSectors: many(warehousesSectors),
}));
