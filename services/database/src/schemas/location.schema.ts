import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { sectors } from './sector.schema';

export const locations = pgTable(
  'locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    airtableId: varchar('airtable_id', { length: 50 }).unique(),
    locationId: varchar('location_id', { length: 50 }).unique(),

    name: varchar('name', { length: 255 }).notNull(),
    address: text('address').notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 50 }).notNull(),
    zip: varchar('zip', { length: 20 }).notNull(),

    pockets: jsonb('pockets')
      .$type<{ width: number; height: number }>()
      .notNull(),
    isDefaultPockets: boolean('is_default_pockets').default(false).notNull(),

    route4MeId: varchar('route4me_id', { length: 50 }),
  },
  (table) => [
    index('airtable_id_idx').on(table.airtableId),
    index('location_id_idx').on(table.locationId),
  ],
);

export const locationsSectors = pgTable(
  'locations_sectors',
  {
    locationId: uuid('location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'cascade' }),

    sectorId: uuid('sector_id')
      .notNull()
      .references(() => sectors.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.locationId, table.sectorId] }),
    index('locations_sectors_location_id_idx').on(table.locationId),
    index('locations_sectors_sector_id_idx').on(table.sectorId),
  ],
);

export const locationsRelations = relations(locations, ({ many }) => ({
  locationsSectors: many(locationsSectors),
}));

export const locationsSectorsRelations = relations(
  locationsSectors,
  ({ one }) => ({
    location: one(locations, {
      fields: [locationsSectors.locationId],
      references: [locations.id],
    }),
    sector: one(sectors, {
      fields: [locationsSectors.sectorId],
      references: [sectors.id],
    }),
  }),
);
