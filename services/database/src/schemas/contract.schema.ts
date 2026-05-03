import { relations } from 'drizzle-orm';
import {
  date,
  index,
  pgEnum,
  pgTable,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { customers } from './customer.schema';
import { sectors } from './sector.schema';

export const unitOfMeasureEnum = pgEnum('unit_of_measure', ['BROCH', 'MAG']);

export enum ContractTier {
  TIER_1 = 'Normal Placement',
  TIER_2 = 'Premium Placement',
}

export const contractTierEnum = pgEnum('contract_tier', [
  'Normal Placement',
  'Premium Placement',
]);

export const contracts = pgTable(
  'contracts',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    acumaticaContractId: varchar('acumatica_contract_id', {
      length: 50,
    }).notNull(),
    revisionNumber: varchar('revision_number', { length: 10 })
      .notNull()
      .default('00001'),

    customerUuid: uuid('customer_uuid').references(() => customers.id, {
      onDelete: 'set null',
    }),

    tier: contractTierEnum('tier').notNull().default('Normal Placement'),
    status: varchar('status', { length: 50 }).notNull().default('Open'),

    beginningDate: date('beginning_date'),
    endDate: date('end_date'),
  },
  (table) => [
    unique('contracts_acumatica_revision_unique').on(
      table.acumaticaContractId,
      table.revisionNumber,
    ),
    index('contracts_acumatica_id_idx').on(table.acumaticaContractId),
  ],
);

export const contractDistributions = pgTable(
  'contract_distributions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    acumaticaDistributionId: varchar('acumatica_distribution_id', {
      length: 100,
    }),

    contractId: uuid('contract_id')
      .notNull()
      .references(() => contracts.id, { onDelete: 'cascade' }),

    sectorId: uuid('sector_id')
      .notNull()
      .references(() => sectors.id),

    description: varchar('description', { length: 255 }),

    beginningDate: date('beginning_date').notNull(),
    endingDate: date('ending_date').notNull(),

    unitOfMeasure: unitOfMeasureEnum('unit_of_measure').notNull(),
  },
  (table) => [
    index('distributions_contract_id_idx').on(table.contractId),
    index('distributions_sector_id_idx').on(table.sectorId),
  ],
);

export const contractsRelations = relations(contracts, ({ one, many }) => ({
  distributions: many(contractDistributions),
  customer: one(customers, {
    fields: [contracts.customerUuid],
    references: [customers.id],
  }),
}));

export const contractDistributionsRelations = relations(
  contractDistributions,
  ({ one }) => ({
    contract: one(contracts, {
      fields: [contractDistributions.contractId],
      references: [contracts.id],
    }),
    sector: one(sectors, {
      fields: [contractDistributions.sectorId],
      references: [sectors.id],
    }),
  }),
);