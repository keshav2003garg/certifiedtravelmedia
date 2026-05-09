/* eslint-disable no-console */

import { createHash } from 'node:crypto';

import pg from 'pg';

const { Pool } = pg;

const args = new Set(process.argv.slice(2));
const shouldCommit = args.has('--commit');
const isDryRun = args.has('--dry-run') || !shouldCommit;
const createMissingWarehouses = args.has('--create-missing-warehouses');
const createMissingBrochureTypes = args.has('--create-missing-brochure-types');

const databaseUrl = process.env.DATABASE_URL;
const migrationStartedAt = new Date().toISOString();

if (!databaseUrl) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const REDUCING_TRANSACTION_TYPES = new Set([
  'Distribution',
  'Recycle',
  'Return to Client',
  'Trans Out',
]);

const REQUEST_TRANSACTION_TYPES = new Set(['Delivery', 'Start Count']);
const SLOW_STEP_LOG_AFTER_MS = 10_000;
const STILL_WORKING_LOG_INTERVAL_MS = 30_000;

class PreflightError extends Error {
  constructor(errors) {
    super('Old inventory migration preflight failed.');
    this.errors = errors;
  }
}

function createSummary() {
  return {
    oldRows: 0,
    alreadyMapped: 0,
    pendingRequests: 0,
    confirmedRows: 0,
    mappings: 0,
    createdCustomers: 0,
    createdWarehouses: 0,
    createdBrochureTypes: 0,
    createdBrochures: 0,
    createdImages: 0,
    updatedImages: 0,
    createdPackSizes: 0,
    createdInventoryItems: 0,
    updatedInventoryItems: 0,
    createdTransactions: 0,
    warnings: [],
  };
}

function formatDuration(milliseconds) {
  if (milliseconds < 1000) return `${milliseconds}ms`;

  const totalSeconds = milliseconds / 1000;
  if (totalSeconds < 60) return `${totalSeconds.toFixed(1)}s`;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);

  return `${minutes}m ${seconds}s`;
}

function logStep(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function describeDatabaseInfo(info) {
  const address = info.server_address ?? 'local/unknown-host';
  const port = info.server_port ?? 'unknown-port';

  return `${info.database_name} as ${info.database_user} on ${address}:${port}`;
}

function describeMigrationTotals(summary) {
  return [
    `${summary.confirmedRows} confirmed`,
    `${summary.pendingRequests} pending requests`,
    `${summary.mappings} mappings`,
    `${summary.createdTransactions} transactions`,
    `${summary.createdInventoryItems} items created`,
    `${summary.updatedInventoryItems} items updated`,
  ].join(', ');
}

function startStillWorkingLog(
  label,
  startedAt,
  afterMs = SLOW_STEP_LOG_AFTER_MS,
  intervalMs = STILL_WORKING_LOG_INTERVAL_MS,
) {
  let interval = null;
  const timeout = setTimeout(() => {
    logStep(
      `${label} is still running after ${formatDuration(Date.now() - startedAt)}.`,
    );

    interval = setInterval(() => {
      logStep(
        `${label} is still running after ${formatDuration(Date.now() - startedAt)}.`,
      );
    }, intervalMs);
    interval.unref?.();
  }, afterMs);

  timeout.unref?.();

  return () => {
    clearTimeout(timeout);
    if (interval) clearInterval(interval);
  };
}

async function runLoggedStep(label, action) {
  const startedAt = Date.now();
  logStep(`${label} started.`);
  const stopStillWorkingLog = startStillWorkingLog(label, startedAt);

  try {
    const result = await action();
    stopStillWorkingLog();
    logStep(`${label} done in ${formatDuration(Date.now() - startedAt)}.`);

    return result;
  } catch (error) {
    stopStillWorkingLog();
    logStep(`${label} failed after ${formatDuration(Date.now() - startedAt)}.`);
    throw error;
  }
}

function shouldLogRowProgress(current, total) {
  if (total <= 50) return true;
  if (current === 1 || current === total) return true;

  const interval = Math.max(10, Math.ceil(total / 20));
  return current % interval === 0;
}

async function processRows(label, rows, processRow, describeResult) {
  const startedAt = Date.now();

  if (rows.length === 0) {
    logStep(`${label}: no rows to process.`);
    return;
  }

  logStep(`${label}: starting ${rows.length} rows.`);

  for (let index = 0; index < rows.length; index += 1) {
    const preparedRow = rows[index];
    const current = index + 1;
    const rowStartedAt = Date.now();
    const rowLabel = `${label}: row ${current}/${rows.length} (old id ${preparedRow.oldId})`;
    const shouldLog = shouldLogRowProgress(current, rows.length);
    const stopStillWorkingLog = startStillWorkingLog(rowLabel, rowStartedAt);

    if (shouldLog) logStep(`${rowLabel} started.`);

    try {
      const result = await processRow(preparedRow);
      stopStillWorkingLog();

      if (shouldLog) {
        const details = describeResult?.(result);
        const elapsedMs = Date.now() - startedAt;
        const averageMs = elapsedMs / current;
        const remainingMs = Math.max(0, (rows.length - current) * averageMs);

        logStep(
          `${rowLabel} done in ${formatDuration(Date.now() - rowStartedAt)}${
            details ? ` (${details})` : ''
          }. Elapsed ${formatDuration(elapsedMs)}, estimated remaining ${formatDuration(remainingMs)}.`,
        );
      }
    } catch (error) {
      stopStillWorkingLog();
      logStep(
        `${rowLabel} failed after ${formatDuration(Date.now() - rowStartedAt)}.`,
      );
      throw error;
    }
  }

  logStep(
    `${label}: done ${rows.length} rows in ${formatDuration(Date.now() - startedAt)}.`,
  );
}

function normalizeText(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : null;
}

function normalizeLookupKey(value) {
  return normalizeText(value)?.toLowerCase() ?? null;
}

function normalizeNullableId(value) {
  const normalized = normalizeText(value);
  if (!normalized || normalized.toLowerCase() === 'null') return null;

  return normalized;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function hashValue(value, length = 14) {
  return createHash('sha1').update(value).digest('hex').slice(0, length);
}

function createLegacyCode(prefix, seed) {
  return `${prefix}-${hashValue(seed).toUpperCase()}`.slice(0, 50);
}

function roundDecimals(value, decimals = 2) {
  return Number(value.toFixed(decimals));
}

function parseNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const normalized = normalizeText(value);
  if (!normalized) return null;

  const cleaned = normalized.replace(/,/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function dateFromParts(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function parseDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const normalized = normalizeText(value);
  if (!normalized) return null;

  const isoMatch = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.exec(normalized);
  if (isoMatch) {
    return dateFromParts(
      Number(isoMatch[1]),
      Number(isoMatch[2]),
      Number(isoMatch[3]),
    );
  }

  const usMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(normalized);
  if (usMatch) {
    return dateFromParts(
      Number(usMatch[3]),
      Number(usMatch[1]),
      Number(usMatch[2]),
    );
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString().slice(0, 10);
}

function parseTimestamp(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  const normalized = normalizeText(value);
  if (!normalized) return null;

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function maxTimestamp(left, right) {
  return new Date(left).getTime() >= new Date(right).getTime() ? left : right;
}

function addWarning(summary, oldId, message) {
  summary.warnings.push({ oldId, message });
}

function truncateValue(value, maxLength, fieldName, oldId, summary) {
  if (!value || value.length <= maxLength) return value;

  addWarning(
    summary,
    oldId,
    `${fieldName} was truncated to ${maxLength} characters.`,
  );
  return value.slice(0, maxLength);
}

function mapStockLevel(value, oldId, summary) {
  const key = normalizeLookupKey(value);
  if (!key) return 'On Target';

  if (key.includes('low')) return 'Low';
  if (key.includes('over')) return 'Overstock';
  if (key.includes('target') || key.includes('normal')) return 'On Target';

  addWarning(
    summary,
    oldId,
    `Unknown stock_level "${value}" defaulted to On Target.`,
  );
  return 'On Target';
}

function mapTransactionType(value, oldId, summary) {
  const original = normalizeText(value);
  const key = original?.toLowerCase().replace(/[\s_-]+/g, ' ') ?? null;

  if (!key) {
    addWarning(
      summary,
      oldId,
      'Missing transaction_type defaulted to Delivery.',
    );
    return { value: 'Delivery', wasDefaulted: true, original };
  }

  if (key.includes('start'))
    return { value: 'Start Count', wasDefaulted: false, original };
  if (key.includes('delivery') || key.includes('deliver')) {
    return { value: 'Delivery', wasDefaulted: false, original };
  }
  if (key.includes('distribution') || key === 'dist') {
    return { value: 'Distribution', wasDefaulted: false, original };
  }
  if (key.includes('recycle'))
    return { value: 'Recycle', wasDefaulted: false, original };
  if (key.includes('return')) {
    return { value: 'Return to Client', wasDefaulted: false, original };
  }
  if (key.includes('adjust'))
    return { value: 'Adjustment', wasDefaulted: false, original };
  if (key.includes('trans in') || key.includes('transfer in')) {
    return { value: 'Trans In', wasDefaulted: false, original };
  }
  if (key.includes('trans out') || key.includes('transfer out')) {
    return { value: 'Trans Out', wasDefaulted: false, original };
  }

  addWarning(
    summary,
    oldId,
    `Unknown transaction_type "${original}" defaulted to Delivery.`,
  );
  return { value: 'Delivery', wasDefaulted: true, original };
}

function isUnconfirmedStatus(value) {
  const key = normalizeLookupKey(value);
  return Boolean(key && (key.includes('unconfirmed') || key === 'pending'));
}

function getOriginalNote(value) {
  if (value === null || value === undefined) return null;

  const note = String(value);
  return note.trim().length > 0 ? note : null;
}

function buildLegacyNotes(row) {
  return getOriginalNote(row.notes);
}

function addByKey(map, value, record) {
  const key = normalizeLookupKey(value);
  if (key && !map.has(key)) map.set(key, record);
}

function createLookupState({ warehouses, brochureTypes, customers }) {
  const lookups = {
    warehouses: {
      byId: new Map(),
      byAcumaticaId: new Map(),
      byName: new Map(),
    },
    brochureTypes: {
      byId: new Map(),
      byName: new Map(),
    },
    customers: {
      byId: new Map(),
      byAcumaticaId: new Map(),
      byName: new Map(),
      byLegacyKey: new Map(),
    },
    brochures: new Map(),
    imagesByBrochureId: new Map(),
    packSizes: new Map(),
    inventoryItems: new Map(),
  };

  for (const warehouse of warehouses) addWarehouseLookup(lookups, warehouse);
  for (const brochureType of brochureTypes)
    addBrochureTypeLookup(lookups, brochureType);
  for (const customer of customers) addCustomerLookup(lookups, customer);

  return lookups;
}

function addWarehouseLookup(lookups, warehouse) {
  lookups.warehouses.byId.set(warehouse.id, warehouse);
  addByKey(lookups.warehouses.byAcumaticaId, warehouse.acumatica_id, warehouse);
  addByKey(lookups.warehouses.byName, warehouse.name, warehouse);
}

function addBrochureTypeLookup(lookups, brochureType) {
  lookups.brochureTypes.byId.set(brochureType.id, brochureType);
  addByKey(lookups.brochureTypes.byName, brochureType.name, brochureType);
}

function addCustomerLookup(lookups, customer) {
  lookups.customers.byId.set(customer.id, customer);
  addByKey(lookups.customers.byAcumaticaId, customer.acumatica_id, customer);
  addByKey(lookups.customers.byName, customer.name, customer);
}

function resolveWarehouse(rawWarehouseId, lookups) {
  const value = normalizeText(rawWarehouseId);
  if (!value) return null;

  if (isUuid(value) && lookups.warehouses.byId.has(value)) {
    return lookups.warehouses.byId.get(value);
  }

  return (
    lookups.warehouses.byAcumaticaId.get(value.toLowerCase()) ??
    lookups.warehouses.byName.get(value.toLowerCase()) ??
    null
  );
}

function resolveBrochureType(rawBrochureTypeId, lookups) {
  const value = normalizeText(rawBrochureTypeId);
  if (!value) return null;

  if (isUuid(value) && lookups.brochureTypes.byId.has(value)) {
    return lookups.brochureTypes.byId.get(value);
  }

  return lookups.brochureTypes.byName.get(value.toLowerCase()) ?? null;
}

function resolveCustomer(rawCustomerId, rawCustomerName, lookups) {
  const customerId = normalizeText(rawCustomerId);
  const customerName = normalizeText(rawCustomerName);

  if (
    customerId &&
    isUuid(customerId) &&
    lookups.customers.byId.has(customerId)
  ) {
    return lookups.customers.byId.get(customerId);
  }

  if (customerId) {
    const byAcumaticaId = lookups.customers.byAcumaticaId.get(
      customerId.toLowerCase(),
    );
    if (byAcumaticaId) return byAcumaticaId;
  }

  if (customerName) {
    const byName = lookups.customers.byName.get(customerName.toLowerCase());
    if (byName) return byName;
  }

  return null;
}

function createLegacyCustomerKey(rawCustomerId, rawCustomerName) {
  const id = normalizeLookupKey(rawCustomerId);
  if (!id) return null;

  const name = normalizeLookupKey(rawCustomerName) ?? '';
  return `${id}|${name}`;
}

function prepareRows(oldRows, lookups, summary) {
  const errors = [];

  const rows = oldRows.map((oldRow) => {
    const oldId = oldRow.id;
    const status = normalizeText(oldRow.status);
    const isPendingRequest = isUnconfirmedStatus(status);
    const createdAt = parseTimestamp(oldRow.created_at) ?? migrationStartedAt;
    const updatedAt = parseTimestamp(oldRow.updated_at) ?? createdAt;
    const parsedDate = parseDate(oldRow.date_received);
    const transactionDate = parsedDate ?? createdAt.slice(0, 10);

    if (!parsedDate) {
      addWarning(
        summary,
        oldId,
        'date_received was missing or invalid, so created_at/current date was used.',
      );
    }

    const boxes = parseNumber(oldRow.boxes);
    const unitsPerBox = parseNumber(oldRow.units_per_box);
    const brochureName = truncateValue(
      normalizeText(oldRow.brochure_name),
      255,
      'brochure_name',
      oldId,
      summary,
    );
    const sourceCustomerId = normalizeNullableId(oldRow.customer_id);
    const customerName = truncateValue(
      normalizeText(oldRow.entered_customer_name),
      255,
      'entered_customer_name',
      oldId,
      summary,
    );
    const imageUrl = truncateValue(
      normalizeText(oldRow.cover_photo_url),
      500,
      'cover_photo_url',
      oldId,
      summary,
    );
    const qrCodeUrl = truncateValue(
      normalizeText(oldRow.qr_code_url),
      500,
      'qr_code_url',
      oldId,
      summary,
    );
    const transactionType = mapTransactionType(
      oldRow.transaction_type,
      oldId,
      summary,
    );
    const stockLevel = mapStockLevel(oldRow.stock_level, oldId, summary);
    const warehouse = resolveWarehouse(oldRow.warehouse_id, lookups);
    const brochureType = resolveBrochureType(oldRow.brochure_type_id, lookups);
    const customer = resolveCustomer(
      sourceCustomerId,
      sourceCustomerId ? oldRow.entered_customer_name : null,
      lookups,
    );
    const legacyCustomerKey = createLegacyCustomerKey(
      sourceCustomerId,
      sourceCustomerId ? oldRow.entered_customer_name : null,
    );

    if (boxes === null) errors.push(`${oldId}: boxes is missing or invalid.`);
    if (unitsPerBox === null || unitsPerBox <= 0) {
      errors.push(`${oldId}: units_per_box must be a positive number.`);
    }

    if (!isPendingRequest) {
      if (!brochureName)
        errors.push(
          `${oldId}: brochure_name is required for inventory migration.`,
        );
      if (
        !warehouse &&
        (!createMissingWarehouses || !normalizeText(oldRow.warehouse_id))
      ) {
        errors.push(`${oldId}: warehouse_id could not be resolved.`);
      }
      if (
        !brochureType &&
        (!createMissingBrochureTypes || !normalizeText(oldRow.brochure_type_id))
      ) {
        errors.push(`${oldId}: brochure_type_id could not be resolved.`);
      }
    }

    return {
      oldRow,
      oldId,
      status,
      isPendingRequest,
      createdAt,
      updatedAt,
      transactionDate,
      boxes: boxes === null ? null : roundDecimals(boxes),
      transactionBoxes: boxes === null ? null : roundDecimals(Math.abs(boxes)),
      unitsPerBox: unitsPerBox === null ? null : roundDecimals(unitsPerBox),
      brochureName,
      customerName,
      imageUrl,
      qrCodeUrl,
      transactionType,
      stockLevel,
      warehouse,
      brochureType,
      customer,
      legacyCustomerKey,
    };
  });

  if (errors.length > 0) throw new PreflightError(errors);

  return rows;
}

function comparePreparedRows(left, right) {
  return (
    left.transactionDate.localeCompare(right.transactionDate) ||
    left.createdAt.localeCompare(right.createdAt) ||
    left.oldId.localeCompare(right.oldId)
  );
}

async function queryOne(client, text, params = []) {
  const result = await client.query(text, params);
  return result.rows[0] ?? null;
}

async function assertSourceTableExists(client) {
  const row = await queryOne(
    client,
    "select to_regclass('public.old_inventory_items') as table_name",
  );

  if (!row?.table_name) {
    throw new Error('public.old_inventory_items does not exist.');
  }
}

async function assertMappingTableExists(client) {
  const row = await queryOne(
    client,
    `
      select
        to_regclass('public.old_inventory_item_mappings') as table_name,
        to_regtype('public.old_inventory_item_migration_target') as enum_name
    `,
  );

  if (!row?.table_name) {
    throw new Error(
      'public.old_inventory_item_mappings does not exist. Run the database migration that creates the permanent old inventory mapping table before running this script.',
    );
  }

  if (!row?.enum_name) {
    throw new Error(
      'public.old_inventory_item_migration_target does not exist. Run the database migration that creates the permanent old inventory mapping enum before running this script.',
    );
  }
}

async function loadLookups(client) {
  const warehouseRows = await client.query(
    'select id, acumatica_id, name from public.warehouses',
  );
  const brochureTypeRows = await client.query(
    'select id, name from public.brochure_types',
  );
  const customerRows = await client.query(
    'select id, acumatica_id, name from public.customers',
  );

  return createLookupState({
    warehouses: warehouseRows.rows,
    brochureTypes: brochureTypeRows.rows,
    customers: customerRows.rows,
  });
}

async function loadDatabaseInfo(client) {
  return queryOne(
    client,
    `
      select
        current_database() as database_name,
        current_user as database_user,
        inet_server_addr()::text as server_address,
        inet_server_port()::text as server_port
    `,
  );
}

async function loadCommittedMigrationCounts(client) {
  return queryOne(
    client,
    `
      select
        count(*)::int as mappings,
        count(*) filter (where migrated_as = 'inventory_item')::int as inventory_item_mappings,
        count(*) filter (where migrated_as = 'inventory_transaction_request')::int as request_mappings,
        count(distinct new_inventory_item_id)::int as mapped_inventory_items,
        count(distinct inventory_transaction_id)::int as mapped_transactions,
        count(distinct inventory_transaction_request_id)::int as mapped_requests
      from public.old_inventory_item_mappings
    `,
  );
}

async function loadOldRows(client) {
  const stats = await queryOne(
    client,
    `
    select
      count(old_items.id)::int as old_rows,
      count(mapping.old_inventory_item_id)::int as already_mapped
    from public.old_inventory_items old_items
    left join public.old_inventory_item_mappings mapping
      on mapping.old_inventory_item_id = old_items.id
  `,
  );

  const rows = await client.query(`
    select old_items.*
    from public.old_inventory_items old_items
    left join public.old_inventory_item_mappings mapping
      on mapping.old_inventory_item_id = old_items.id
    where mapping.old_inventory_item_id is null
    order by
      coalesce(old_items.created_at, old_items.updated_at, now()),
      old_items.id
  `);

  return {
    oldRows: Number(stats?.old_rows ?? 0),
    alreadyMapped: Number(stats?.already_mapped ?? 0),
    rows: rows.rows,
  };
}

async function ensureWarehouse(client, preparedRow, lookups, summary) {
  if (preparedRow.warehouse) return preparedRow.warehouse;

  const sourceValue = normalizeText(preparedRow.oldRow.warehouse_id);
  if (!createMissingWarehouses || !sourceValue) return null;

  const seed = `warehouse:${sourceValue}`;
  const sourceCanBeAcumaticaId =
    sourceValue.length <= 50 && !isUuid(sourceValue);
  const acumaticaId = sourceCanBeAcumaticaId
    ? sourceValue
    : createLegacyCode('LEGACY-WH', seed);

  const existingByAcumaticaId = lookups.warehouses.byAcumaticaId.get(
    acumaticaId.toLowerCase(),
  );
  if (existingByAcumaticaId) return existingByAcumaticaId;

  const name = truncateValue(
    `Legacy Warehouse ${sourceValue}`,
    255,
    'legacy warehouse name',
    preparedRow.oldId,
    summary,
  );

  const warehouse = await queryOne(
    client,
    `
      insert into public.warehouses (acumatica_id, name, is_active, created_at, updated_at)
      values ($1, $2, true, $3, $4)
      returning id, acumatica_id, name
    `,
    [acumaticaId, name, preparedRow.createdAt, preparedRow.updatedAt],
  );

  addWarehouseLookup(lookups, warehouse);
  summary.createdWarehouses += 1;
  preparedRow.warehouse = warehouse;

  return warehouse;
}

async function ensureBrochureType(client, preparedRow, lookups, summary) {
  if (preparedRow.brochureType) return preparedRow.brochureType;

  const sourceValue = normalizeText(preparedRow.oldRow.brochure_type_id);
  if (!createMissingBrochureTypes || !sourceValue) return null;

  const typeName = truncateValue(
    isUuid(sourceValue)
      ? `Legacy Brochure Type ${sourceValue.slice(0, 8)}`
      : sourceValue,
    255,
    'legacy brochure type name',
    preparedRow.oldId,
    summary,
  );
  const existingByName = lookups.brochureTypes.byName.get(
    typeName.toLowerCase(),
  );
  if (existingByName) return existingByName;

  const brochureType = await queryOne(
    client,
    `
      insert into public.brochure_types (name, col_span, created_at, updated_at)
      values ($1, 1, $2, $3)
      returning id, name
    `,
    [typeName, preparedRow.createdAt, preparedRow.updatedAt],
  );

  addBrochureTypeLookup(lookups, brochureType);
  summary.createdBrochureTypes += 1;
  preparedRow.brochureType = brochureType;

  return brochureType;
}

async function ensureCustomer(client, preparedRow, lookups, summary) {
  if (preparedRow.customer) return preparedRow.customer;
  if (!preparedRow.legacyCustomerKey) return null;

  const cached = lookups.customers.byLegacyKey.get(
    preparedRow.legacyCustomerKey,
  );
  if (cached) return cached;

  const rawCustomerId = normalizeNullableId(preparedRow.oldRow.customer_id);
  if (!rawCustomerId) return null;

  const rawCustomerName = normalizeText(
    preparedRow.oldRow.entered_customer_name,
  );
  const sourceCanBeAcumaticaId =
    rawCustomerId && rawCustomerId.length <= 50 && !isUuid(rawCustomerId);
  const generatedAcumaticaId = createLegacyCode(
    'LEGACY-CUST',
    preparedRow.legacyCustomerKey,
  );
  const acumaticaId = sourceCanBeAcumaticaId
    ? rawCustomerId
    : generatedAcumaticaId;
  const existingByAcumaticaId = lookups.customers.byAcumaticaId.get(
    acumaticaId.toLowerCase(),
  );

  if (existingByAcumaticaId) {
    lookups.customers.byLegacyKey.set(
      preparedRow.legacyCustomerKey,
      existingByAcumaticaId,
    );
    return existingByAcumaticaId;
  }

  const name = truncateValue(
    rawCustomerName ?? rawCustomerId ?? acumaticaId,
    255,
    'legacy customer name',
    preparedRow.oldId,
    summary,
  );

  const customer = await queryOne(
    client,
    `
      insert into public.customers (acumatica_id, name, created_at, updated_at)
      values ($1, $2, $3, $4)
      returning id, acumatica_id, name
    `,
    [acumaticaId, name, preparedRow.createdAt, preparedRow.updatedAt],
  );

  addCustomerLookup(lookups, customer);
  lookups.customers.byLegacyKey.set(preparedRow.legacyCustomerKey, customer);
  summary.createdCustomers += 1;
  preparedRow.customer = customer;

  return customer;
}

async function findOrCreateBrochure(client, preparedRow, lookups, summary) {
  const customer = await ensureCustomer(client, preparedRow, lookups, summary);
  const brochureKey = [
    preparedRow.brochureName.toLowerCase(),
    preparedRow.brochureType.id,
    customer?.id ?? 'null',
  ].join('|');

  const cached = lookups.brochures.get(brochureKey);
  if (cached) return cached;

  const existing = await queryOne(
    client,
    `
      select id, name, brochure_type_id, customer_id
      from public.brochures
      where lower(name) = lower($1)
        and brochure_type_id = $2
        and (
          customer_id = $3::uuid
          or ($3::uuid is null and customer_id is null)
        )
      order by created_at, id
      limit 1
    `,
    [
      preparedRow.brochureName,
      preparedRow.brochureType.id,
      customer?.id ?? null,
    ],
  );

  if (existing) {
    lookups.brochures.set(brochureKey, existing);
    return existing;
  }

  const brochure = await queryOne(
    client,
    `
      insert into public.brochures (
        name,
        brochure_type_id,
        customer_id,
        created_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5)
      returning id, name, brochure_type_id, customer_id
    `,
    [
      preparedRow.brochureName,
      preparedRow.brochureType.id,
      customer?.id ?? null,
      preparedRow.createdAt,
      preparedRow.updatedAt,
    ],
  );

  lookups.brochures.set(brochureKey, brochure);
  summary.createdBrochures += 1;

  return brochure;
}

async function findImageByBrochure(client, brochureId, imageUrl) {
  if (imageUrl) {
    const matchingImage = await queryOne(
      client,
      `
        select id, brochure_id, image_url, sort_order
        from public.brochure_images
        where brochure_id = $1 and image_url = $2
        order by sort_order, created_at, id
        limit 1
      `,
      [brochureId, imageUrl],
    );

    if (matchingImage) return matchingImage;
  }

  return queryOne(
    client,
    `
      select id, brochure_id, image_url, sort_order
      from public.brochure_images
      where brochure_id = $1
      order by sort_order, created_at, id
      limit 1
    `,
    [brochureId],
  );
}

async function findOrCreateBrochureImage(
  client,
  preparedRow,
  brochure,
  lookups,
  summary,
) {
  const cached = lookups.imagesByBrochureId.get(brochure.id);

  if (cached) {
    if (!cached.image_url && preparedRow.imageUrl) {
      const updated = await queryOne(
        client,
        `
          update public.brochure_images
          set image_url = $1, updated_at = $2
          where id = $3
          returning id, brochure_id, image_url, sort_order
        `,
        [preparedRow.imageUrl, preparedRow.updatedAt, cached.id],
      );

      lookups.imagesByBrochureId.set(brochure.id, updated);
      summary.updatedImages += 1;
      return updated;
    }

    if (
      cached.image_url &&
      preparedRow.imageUrl &&
      cached.image_url !== preparedRow.imageUrl
    ) {
      addWarning(
        summary,
        preparedRow.oldId,
        'A different cover_photo_url was found for the same brochure group; the first image was reused.',
      );
    }

    return cached;
  }

  const existing = await findImageByBrochure(
    client,
    brochure.id,
    preparedRow.imageUrl,
  );

  if (existing) {
    if (!existing.image_url && preparedRow.imageUrl) {
      const updated = await queryOne(
        client,
        `
          update public.brochure_images
          set image_url = $1, updated_at = $2
          where id = $3
          returning id, brochure_id, image_url, sort_order
        `,
        [preparedRow.imageUrl, preparedRow.updatedAt, existing.id],
      );

      lookups.imagesByBrochureId.set(brochure.id, updated);
      summary.updatedImages += 1;
      return updated;
    }

    if (
      existing.image_url &&
      preparedRow.imageUrl &&
      existing.image_url !== preparedRow.imageUrl
    ) {
      addWarning(
        summary,
        preparedRow.oldId,
        'An existing image was reused for this brochure group even though cover_photo_url differs.',
      );
    }

    lookups.imagesByBrochureId.set(brochure.id, existing);
    return existing;
  }

  const sortOrderRow = await queryOne(
    client,
    `
      select coalesce(max(sort_order), -1) + 1 as next_sort_order
      from public.brochure_images
      where brochure_id = $1
    `,
    [brochure.id],
  );

  const image = await queryOne(
    client,
    `
      insert into public.brochure_images (
        brochure_id,
        image_url,
        sort_order,
        created_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5)
      returning id, brochure_id, image_url, sort_order
    `,
    [
      brochure.id,
      preparedRow.imageUrl,
      Number(sortOrderRow?.next_sort_order ?? 0),
      preparedRow.createdAt,
      preparedRow.updatedAt,
    ],
  );

  lookups.imagesByBrochureId.set(brochure.id, image);
  summary.createdImages += 1;

  return image;
}

async function findOrCreatePackSize(
  client,
  preparedRow,
  image,
  lookups,
  summary,
) {
  const packSizeKey = `${image.id}:${preparedRow.unitsPerBox.toFixed(2)}`;
  const cached = lookups.packSizes.get(packSizeKey);
  if (cached) return cached;

  const existing = await queryOne(
    client,
    `
      select id, brochure_image_id, units_per_box
      from public.brochure_image_pack_sizes
      where brochure_image_id = $1 and units_per_box = $2
      limit 1
    `,
    [image.id, preparedRow.unitsPerBox],
  );

  if (existing) {
    lookups.packSizes.set(packSizeKey, existing);
    return existing;
  }

  const packSize = await queryOne(
    client,
    `
      insert into public.brochure_image_pack_sizes (
        brochure_image_id,
        units_per_box,
        created_at,
        updated_at
      )
      values ($1, $2, $3, $4)
      returning id, brochure_image_id, units_per_box
    `,
    [
      image.id,
      preparedRow.unitsPerBox,
      preparedRow.createdAt,
      preparedRow.updatedAt,
    ],
  );

  lookups.packSizes.set(packSizeKey, packSize);
  summary.createdPackSizes += 1;

  return packSize;
}

function calculateBalanceAfter(transactionType, balanceBefore, signedBoxes) {
  const amount = roundDecimals(Math.abs(signedBoxes));

  if (transactionType === 'Start Count') {
    return roundDecimals(Math.max(0, signedBoxes));
  }

  const baseDirection = REDUCING_TRANSACTION_TYPES.has(transactionType)
    ? -1
    : 1;
  const signedDirection = signedBoxes < 0 ? baseDirection * -1 : baseDirection;

  return roundDecimals(balanceBefore + signedDirection * amount);
}

async function findInventoryItem(client, warehouseId, packSizeId) {
  return queryOne(
    client,
    `
      select id, warehouse_id, brochure_image_pack_size_id, boxes, stock_level, qr_code_url, created_at, updated_at
      from public.inventory_items
      where warehouse_id = $1 and brochure_image_pack_size_id = $2
      limit 1
    `,
    [warehouseId, packSizeId],
  );
}

async function upsertInventoryAndTransaction(
  client,
  preparedRow,
  packSize,
  lookups,
  summary,
) {
  const itemKey = `${preparedRow.warehouse.id}:${packSize.id}`;
  let item = lookups.inventoryItems.get(itemKey);

  if (!item) {
    item = await findInventoryItem(
      client,
      preparedRow.warehouse.id,
      packSize.id,
    );
  }

  const balanceBefore = item ? Number(item.boxes) : 0;
  const balanceAfter = calculateBalanceAfter(
    preparedRow.transactionType.value,
    balanceBefore,
    preparedRow.boxes,
  );
  const itemUpdatedAt = item
    ? maxTimestamp(item.updated_at, preparedRow.updatedAt)
    : preparedRow.updatedAt;

  if (balanceAfter < 0) {
    addWarning(
      summary,
      preparedRow.oldId,
      `Computed inventory balance is negative (${balanceAfter}).`,
    );
  }

  if (item) {
    const updatedItem = await queryOne(
      client,
      `
        update public.inventory_items
        set
          boxes = $1,
          stock_level = $2,
          qr_code_url = coalesce($3, qr_code_url),
          updated_at = $4
        where id = $5
        returning id, warehouse_id, brochure_image_pack_size_id, boxes, stock_level, qr_code_url, created_at, updated_at
      `,
      [
        balanceAfter,
        preparedRow.stockLevel,
        preparedRow.qrCodeUrl,
        itemUpdatedAt,
        item.id,
      ],
    );

    item = updatedItem;
    summary.updatedInventoryItems += 1;
  } else {
    item = await queryOne(
      client,
      `
        insert into public.inventory_items (
          warehouse_id,
          brochure_image_pack_size_id,
          boxes,
          stock_level,
          qr_code_url,
          created_at,
          updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $7)
        returning id, warehouse_id, brochure_image_pack_size_id, boxes, stock_level, qr_code_url, created_at, updated_at
      `,
      [
        preparedRow.warehouse.id,
        packSize.id,
        balanceAfter,
        preparedRow.stockLevel,
        preparedRow.qrCodeUrl,
        preparedRow.createdAt,
        preparedRow.updatedAt,
      ],
    );

    summary.createdInventoryItems += 1;
  }

  lookups.inventoryItems.set(itemKey, item);

  const notes = buildLegacyNotes(preparedRow.oldRow);

  const transaction = await queryOne(
    client,
    `
      insert into public.inventory_transactions (
        inventory_item_id,
        transaction_type,
        transaction_date,
        boxes,
        balance_before_boxes,
        balance_after_boxes,
        notes,
        created_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      returning id
    `,
    [
      item.id,
      preparedRow.transactionType.value,
      preparedRow.transactionDate,
      preparedRow.transactionBoxes,
      balanceBefore,
      balanceAfter,
      notes,
      preparedRow.createdAt,
      preparedRow.updatedAt,
    ],
  );

  summary.createdTransactions += 1;

  return { item, transaction };
}

async function insertPendingRequest(client, preparedRow, summary) {
  const requestTransactionType = REQUEST_TRANSACTION_TYPES.has(
    preparedRow.transactionType.value,
  )
    ? preparedRow.transactionType.value
    : 'Delivery';
  const requestNotes = buildLegacyNotes(preparedRow.oldRow);

  const request = await queryOne(
    client,
    `
      insert into public.inventory_transaction_requests (
        status,
        warehouse_id,
        brochure_type_id,
        brochure_name,
        customer_name,
        image_url,
        date_received,
        boxes,
        units_per_box,
        transaction_type,
        notes,
        created_at,
        updated_at
      )
      values ('Pending', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      returning id
    `,
    [
      preparedRow.warehouse?.id ?? null,
      preparedRow.brochureType?.id ?? null,
      preparedRow.brochureName,
      preparedRow.customer?.name ?? preparedRow.customerName,
      preparedRow.imageUrl,
      preparedRow.transactionDate,
      preparedRow.transactionBoxes,
      preparedRow.unitsPerBox,
      requestTransactionType,
      requestNotes,
      preparedRow.createdAt,
      preparedRow.updatedAt,
    ],
  );

  summary.pendingRequests += 1;

  return request;
}

async function insertMapping(client, params, summary) {
  await client.query(
    `
      insert into public.old_inventory_item_mappings (
        old_inventory_item_id,
        new_inventory_item_id,
        inventory_transaction_id,
        inventory_transaction_request_id,
        brochure_id,
        brochure_image_id,
        brochure_image_pack_size_id,
        migrated_as,
        source_status,
        source_transaction_type,
        migration_notes
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      on conflict (old_inventory_item_id) do nothing
    `,
    [
      params.oldId,
      params.inventoryItemId ?? null,
      params.transactionId ?? null,
      params.requestId ?? null,
      params.brochureId ?? null,
      params.imageId ?? null,
      params.packSizeId ?? null,
      params.migratedAs,
      params.sourceStatus ?? null,
      params.sourceTransactionType ?? null,
      params.notes ?? null,
    ],
  );

  summary.mappings += 1;
}

async function migrateConfirmedRow(client, preparedRow, lookups, summary) {
  preparedRow.warehouse = await ensureWarehouse(
    client,
    preparedRow,
    lookups,
    summary,
  );
  preparedRow.brochureType = await ensureBrochureType(
    client,
    preparedRow,
    lookups,
    summary,
  );

  const brochure = await findOrCreateBrochure(
    client,
    preparedRow,
    lookups,
    summary,
  );
  const image = await findOrCreateBrochureImage(
    client,
    preparedRow,
    brochure,
    lookups,
    summary,
  );
  const packSize = await findOrCreatePackSize(
    client,
    preparedRow,
    image,
    lookups,
    summary,
  );
  const { item, transaction } = await upsertInventoryAndTransaction(
    client,
    preparedRow,
    packSize,
    lookups,
    summary,
  );

  await insertMapping(
    client,
    {
      oldId: preparedRow.oldId,
      inventoryItemId: item.id,
      transactionId: transaction.id,
      brochureId: brochure.id,
      imageId: image.id,
      packSizeId: packSize.id,
      migratedAs: 'inventory_item',
      sourceStatus: preparedRow.status,
      sourceTransactionType: normalizeText(preparedRow.oldRow.transaction_type),
      notes: 'Migrated as confirmed inventory and inventory transaction.',
    },
    summary,
  );

  summary.confirmedRows += 1;

  return { item, transaction };
}

async function migratePendingRequestRow(client, preparedRow, lookups, summary) {
  preparedRow.warehouse =
    preparedRow.warehouse ??
    (await ensureWarehouse(client, preparedRow, lookups, summary));
  preparedRow.brochureType =
    preparedRow.brochureType ??
    (await ensureBrochureType(client, preparedRow, lookups, summary));

  const request = await insertPendingRequest(client, preparedRow, summary);

  await insertMapping(
    client,
    {
      oldId: preparedRow.oldId,
      requestId: request.id,
      migratedAs: 'inventory_transaction_request',
      sourceStatus: preparedRow.status,
      sourceTransactionType: normalizeText(preparedRow.oldRow.transaction_type),
      notes: 'Migrated as pending inventory transaction request.',
    },
    summary,
  );

  return { request };
}

function printSummary(summary) {
  console.log('\nMigration summary');
  console.table({
    oldRows: summary.oldRows,
    alreadyMapped: summary.alreadyMapped,
    confirmedRows: summary.confirmedRows,
    pendingRequests: summary.pendingRequests,
    mappings: summary.mappings,
    createdCustomers: summary.createdCustomers,
    createdWarehouses: summary.createdWarehouses,
    createdBrochureTypes: summary.createdBrochureTypes,
    createdBrochures: summary.createdBrochures,
    createdImages: summary.createdImages,
    updatedImages: summary.updatedImages,
    createdPackSizes: summary.createdPackSizes,
    createdInventoryItems: summary.createdInventoryItems,
    updatedInventoryItems: summary.updatedInventoryItems,
    createdTransactions: summary.createdTransactions,
    warnings: summary.warnings.length,
  });

  if (summary.warnings.length > 0) {
    console.log('\nWarnings');
    for (const warning of summary.warnings.slice(0, 25)) {
      console.log(`- ${warning.oldId}: ${warning.message}`);
    }

    if (summary.warnings.length > 25) {
      console.log(`- ${summary.warnings.length - 25} more warnings omitted.`);
    }
  }
}

async function main() {
  const pool = new Pool({ connectionString: databaseUrl });
  let client = null;
  const summary = createSummary();
  let transactionOpen = false;
  const startedAt = Date.now();

  try {
    logStep(
      `Starting old inventory migration in ${isDryRun ? 'dry-run' : 'commit'} mode.`,
    );
    logStep(
      `Options: createMissingWarehouses=${createMissingWarehouses}, createMissingBrochureTypes=${createMissingBrochureTypes}.`,
    );

    client = await runLoggedStep('Connecting to database', () =>
      pool.connect(),
    );
    const databaseInfo = await runLoggedStep('Reading database target', () =>
      loadDatabaseInfo(client),
    );
    logStep(`Connected to ${describeDatabaseInfo(databaseInfo)}.`);

    await runLoggedStep('Opening database transaction', () =>
      client.query('begin'),
    );
    transactionOpen = true;
    logStep(
      'All migration writes are inside this one transaction. Other DB sessions will not see inserted rows until the final commit finishes.',
    );

    await runLoggedStep('Checking public.old_inventory_items table', () =>
      assertSourceTableExists(client),
    );
    await runLoggedStep(
      'Checking permanent old inventory mapping table and enum',
      () => assertMappingTableExists(client),
    );

    const lookups = await runLoggedStep(
      'Loading warehouses, brochure types, and customers',
      () => loadLookups(client),
    );
    logStep(
      `Loaded lookups: ${lookups.warehouses.byId.size} warehouses, ${lookups.brochureTypes.byId.size} brochure types, ${lookups.customers.byId.size} customers.`,
    );

    const loadedRows = await runLoggedStep(
      'Loading unmapped old inventory rows',
      () => loadOldRows(client),
    );
    summary.oldRows = loadedRows.oldRows;
    summary.alreadyMapped = loadedRows.alreadyMapped;

    logStep(
      `Old rows loaded: ${loadedRows.rows.length} unmapped, ${summary.alreadyMapped} already mapped, ${summary.oldRows} total.`,
    );

    const preparedRows = await runLoggedStep(
      'Preparing and validating old inventory rows',
      () =>
        prepareRows(loadedRows.rows, lookups, summary).sort(
          comparePreparedRows,
        ),
    );
    const pendingRows = preparedRows.filter((row) => row.isPendingRequest);
    const confirmedRows = preparedRows.filter((row) => !row.isPendingRequest);

    logStep(
      `Prepared rows: ${confirmedRows.length} confirmed inventory rows, ${pendingRows.length} pending requests, ${summary.warnings.length} warnings so far.`,
    );
    logStep(
      'During row migration, progress counts are in-memory transaction totals. They become visible in the database only after commit.',
    );

    await processRows(
      'Migrating confirmed inventory rows',
      confirmedRows,
      (preparedRow) =>
        migrateConfirmedRow(client, preparedRow, lookups, summary),
      ({ item, transaction }) =>
        `inventory item ${item.id}, transaction ${transaction.id}; totals ${describeMigrationTotals(summary)}`,
    );

    await processRows(
      'Migrating pending request rows',
      pendingRows,
      (preparedRow) =>
        migratePendingRequestRow(client, preparedRow, lookups, summary),
      ({ request }) =>
        `request ${request.id}; totals ${describeMigrationTotals(summary)}`,
    );

    if (isDryRun) {
      await runLoggedStep('Rolling back dry-run transaction', () =>
        client.query('rollback'),
      );
      transactionOpen = false;
      logStep(
        'Dry run completed. No changes were saved. Re-run with --commit to persist changes.',
      );
    } else {
      await runLoggedStep('Committing transaction', () =>
        client.query('commit'),
      );
      transactionOpen = false;
      logStep('Migration committed.');

      const committedCounts = await runLoggedStep(
        'Verifying committed migration rows',
        () => loadCommittedMigrationCounts(client),
      );
      logStep(
        `Committed DB-visible counts: ${committedCounts.mappings} mappings (${committedCounts.inventory_item_mappings} inventory item mappings, ${committedCounts.request_mappings} request mappings), ${committedCounts.mapped_inventory_items} mapped inventory items, ${committedCounts.mapped_transactions} mapped transactions, ${committedCounts.mapped_requests} mapped requests.`,
      );
    }

    printSummary(summary);
    logStep(
      `Old inventory migration finished in ${formatDuration(Date.now() - startedAt)}.`,
    );
  } catch (error) {
    if (transactionOpen && client) {
      await runLoggedStep('Rolling back transaction after failure', () =>
        client.query('rollback'),
      );
    }

    if (error instanceof PreflightError) {
      console.error('\nPreflight errors');
      for (const message of error.errors.slice(0, 50))
        console.error(`- ${message}`);
      if (error.errors.length > 50) {
        console.error(`- ${error.errors.length - 50} more errors omitted.`);
      }
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  } finally {
    if (client) {
      client.release();
      logStep('Database connection released.');
    }

    await runLoggedStep('Closing database pool', () => pool.end());
  }
}

await main();
