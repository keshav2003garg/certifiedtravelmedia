import { relations } from 'drizzle-orm';
import { index, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { contracts } from './contract.schema';
import { inventoryItems } from './inventory.schema';

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    acumaticaId: varchar('acumatica_id', { length: 50 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),

    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('customers_acumatica_id_idx').on(table.acumaticaId),
    index('customers_name_idx').on(table.name),
  ],
);

export const customersRelations = relations(customers, ({ many }) => ({
  contracts: many(contracts),
  inventoryItems: many(inventoryItems),
}));