import { relations } from 'drizzle-orm';
import {
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { userSchema } from './auth.schema';
import {
  brochureImagePackSizes,
  brochureImages,
  brochures,
  brochureTypes,
} from './brochure.schema';
import { warehouses } from './warehouse.schema';

export const transactionTypeEnum = pgEnum('transaction_type', [
  'Delivery',
  'Distribution',
  'Recycle',
  'Trans In',
  'Trans Out',
  'Return to Client',
  'Adjustment',
  'Start Count',
]);

export const stockLevelEnum = pgEnum('stock_level', [
  'Low',
  'On Target',
  'Overstock',
]);

export const inventoryItems = pgTable(
  'inventory_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id),
    brochureImagePackSizeId: uuid('brochure_image_pack_size_id')
      .notNull()
      .references(() => brochureImagePackSizes.id),

    boxes: real('boxes').notNull(),

    stockLevel: stockLevelEnum('stock_level').notNull().default('On Target'),

    qrCodeUrl: varchar('qr_code_url', { length: 500 }),

    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('inventory_items_warehouse_pack_size_unique').on(
      table.warehouseId,
      table.brochureImagePackSizeId,
    ),
    index('inventory_items_warehouse_id_idx').on(table.warehouseId),
    index('inventory_items_pack_size_id_idx').on(table.brochureImagePackSizeId),
  ],
);

export const inventoryTransactions = pgTable(
  'inventory_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),

    transactionType: transactionTypeEnum('transaction_type').notNull(),
    transactionDate: date('transaction_date').notNull(),

    boxes: real('boxes').notNull(),

    balanceBeforeBoxes: real('balance_before_boxes').notNull(),
    balanceAfterBoxes: real('balance_after_boxes').notNull(),

    requestId: uuid('request_id'),
    transferGroupId: uuid('transfer_group_id'),

    sourceWarehouseId: uuid('source_warehouse_id').references(
      () => warehouses.id,
    ),
    destinationWarehouseId: uuid('destination_warehouse_id').references(
      () => warehouses.id,
    ),

    notes: text('notes'),

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
    index('inventory_txn_item_id_idx').on(table.inventoryItemId),
    index('inventory_txn_transaction_date_idx').on(table.transactionDate),
    index('inventory_txn_request_id_idx').on(table.requestId),
    index('inventory_txn_transfer_group_id_idx').on(table.transferGroupId),
  ],
);

export const inventoryMonthEndCounts = pgTable(
  'inventory_month_end_counts',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),

    month: integer('month').notNull(),
    year: integer('year').notNull(),

    endCount: real('end_count').notNull(),

    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('inventory_month_end_counts_item_month_year_unique').on(
      table.inventoryItemId,
      table.month,
      table.year,
    ),
    index('inventory_month_end_counts_item_id_idx').on(table.inventoryItemId),
    index('inventory_month_end_counts_period_idx').on(table.year, table.month),
  ],
);

export const inventoryRequestStatusEnum = pgEnum('inventory_request_status', [
  'Pending',
  'Approved',
  'Rejected',
  'Cancelled',
]);

export const oldInventoryItemMigrationTargetEnum = pgEnum(
  'old_inventory_item_migration_target',
  ['inventory_item', 'inventory_transaction_request'],
);

export const inventoryTransactionRequests = pgTable(
  'inventory_transaction_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    status: inventoryRequestStatusEnum('status').notNull().default('Pending'),

    warehouseId: uuid('warehouse_id').references(() => warehouses.id),

    brochureTypeId: uuid('brochure_type_id').references(() => brochureTypes.id),
    brochureName: varchar('brochure_name', {
      length: 255,
    }),
    customerName: varchar('customer_name', { length: 255 }),
    imageUrl: varchar('image_url', { length: 500 }),

    dateReceived: date('date_received').notNull(),

    boxes: real('boxes').notNull(),
    unitsPerBox: numeric('units_per_box', {
      precision: 12,
      scale: 2,
      mode: 'number',
    }).notNull(),

    transactionType: transactionTypeEnum('transaction_type')
      .notNull()
      .default('Delivery'),

    notes: text('notes'),

    requestedBy: text('requested_by').references(() => userSchema.id, {
      onDelete: 'set null',
    }),

    reviewedBy: text('reviewed_by').references(() => userSchema.id, {
      onDelete: 'set null',
    }),
    reviewedAt: timestamp('reviewed_at', { mode: 'string' }),

    rejectionReason: text('rejection_reason'),

    approvedInventoryItemId: uuid('approved_inventory_item_id').references(
      () => inventoryItems.id,
    ),
    approvedTransactionId: uuid('approved_transaction_id').references(
      () => inventoryTransactions.id,
    ),

    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('inventory_request_status_idx').on(table.status),
    index('inventory_request_requested_by_idx').on(table.requestedBy),
    index('inventory_request_warehouse_id_idx').on(table.warehouseId),
    index('inventory_request_brochure_type_id_idx').on(table.brochureTypeId),
  ],
);

export const oldInventoryItemMappings = pgTable(
  'old_inventory_item_mappings',
  {
    oldInventoryItemId: uuid('old_inventory_item_id').primaryKey(),

    newInventoryItemId: uuid('new_inventory_item_id').references(
      () => inventoryItems.id,
      { onDelete: 'set null' },
    ),
    inventoryTransactionId: uuid('inventory_transaction_id').references(
      () => inventoryTransactions.id,
      { onDelete: 'set null' },
    ),
    inventoryTransactionRequestId: uuid(
      'inventory_transaction_request_id',
    ).references(() => inventoryTransactionRequests.id, {
      onDelete: 'set null',
    }),

    brochureId: uuid('brochure_id').references(() => brochures.id, {
      onDelete: 'set null',
    }),
    brochureImageId: uuid('brochure_image_id').references(
      () => brochureImages.id,
      { onDelete: 'set null' },
    ),
    brochureImagePackSizeId: uuid('brochure_image_pack_size_id').references(
      () => brochureImagePackSizes.id,
      { onDelete: 'set null' },
    ),

    migratedAs: oldInventoryItemMigrationTargetEnum('migrated_as').notNull(),

    sourceStatus: text('source_status'),
    sourceTransactionType: text('source_transaction_type'),
    migrationNotes: text('migration_notes'),

    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('old_inventory_item_mappings_new_item_idx').on(
      table.newInventoryItemId,
    ),
    index('old_inventory_item_mappings_transaction_idx').on(
      table.inventoryTransactionId,
    ),
    index('old_inventory_item_mappings_request_idx').on(
      table.inventoryTransactionRequestId,
    ),
    index('old_inventory_item_mappings_pack_size_idx').on(
      table.brochureImagePackSizeId,
    ),
    index('old_inventory_item_mappings_migrated_as_idx').on(table.migratedAs),
  ],
);

export const inventoryItemsRelations = relations(
  inventoryItems,
  ({ one, many }) => ({
    warehouse: one(warehouses, {
      fields: [inventoryItems.warehouseId],
      references: [warehouses.id],
    }),
    brochureImagePackSize: one(brochureImagePackSizes, {
      fields: [inventoryItems.brochureImagePackSizeId],
      references: [brochureImagePackSizes.id],
    }),

    transactions: many(inventoryTransactions),
    monthEndCounts: many(inventoryMonthEndCounts),
    oldInventoryItemMappings: many(oldInventoryItemMappings),
  }),
);

export const inventoryTransactionsRelations = relations(
  inventoryTransactions,
  ({ one, many }) => ({
    inventoryItem: one(inventoryItems, {
      fields: [inventoryTransactions.inventoryItemId],
      references: [inventoryItems.id],
    }),
    sourceWarehouse: one(warehouses, {
      fields: [inventoryTransactions.sourceWarehouseId],
      references: [warehouses.id],
    }),
    destinationWarehouse: one(warehouses, {
      fields: [inventoryTransactions.destinationWarehouseId],
      references: [warehouses.id],
    }),
    createdByUser: one(userSchema, {
      fields: [inventoryTransactions.createdBy],
      references: [userSchema.id],
    }),
    oldInventoryItemMappings: many(oldInventoryItemMappings),
  }),
);

export const inventoryMonthEndCountsRelations = relations(
  inventoryMonthEndCounts,
  ({ one }) => ({
    inventoryItem: one(inventoryItems, {
      fields: [inventoryMonthEndCounts.inventoryItemId],
      references: [inventoryItems.id],
    }),
  }),
);

export const inventoryTransactionRequestsRelations = relations(
  inventoryTransactionRequests,
  ({ one, many }) => ({
    requestedByUser: one(userSchema, {
      fields: [inventoryTransactionRequests.requestedBy],
      references: [userSchema.id],
    }),
    requestedWarehouse: one(warehouses, {
      fields: [inventoryTransactionRequests.warehouseId],
      references: [warehouses.id],
    }),
    requestedBrochureType: one(brochureTypes, {
      fields: [inventoryTransactionRequests.brochureTypeId],
      references: [brochureTypes.id],
    }),

    reviewedByUser: one(userSchema, {
      fields: [inventoryTransactionRequests.reviewedBy],
      references: [userSchema.id],
    }),
    approvedInventoryItem: one(inventoryItems, {
      fields: [inventoryTransactionRequests.approvedInventoryItemId],
      references: [inventoryItems.id],
    }),
    approvedTransaction: one(inventoryTransactions, {
      fields: [inventoryTransactionRequests.approvedTransactionId],
      references: [inventoryTransactions.id],
    }),
    oldInventoryItemMappings: many(oldInventoryItemMappings),
  }),
);

export const oldInventoryItemMappingsRelations = relations(
  oldInventoryItemMappings,
  ({ one }) => ({
    newInventoryItem: one(inventoryItems, {
      fields: [oldInventoryItemMappings.newInventoryItemId],
      references: [inventoryItems.id],
    }),
    inventoryTransaction: one(inventoryTransactions, {
      fields: [oldInventoryItemMappings.inventoryTransactionId],
      references: [inventoryTransactions.id],
    }),
    inventoryTransactionRequest: one(inventoryTransactionRequests, {
      fields: [oldInventoryItemMappings.inventoryTransactionRequestId],
      references: [inventoryTransactionRequests.id],
    }),
    brochure: one(brochures, {
      fields: [oldInventoryItemMappings.brochureId],
      references: [brochures.id],
    }),
    brochureImage: one(brochureImages, {
      fields: [oldInventoryItemMappings.brochureImageId],
      references: [brochureImages.id],
    }),
    brochureImagePackSize: one(brochureImagePackSizes, {
      fields: [oldInventoryItemMappings.brochureImagePackSizeId],
      references: [brochureImagePackSizes.id],
    }),
  }),
);
