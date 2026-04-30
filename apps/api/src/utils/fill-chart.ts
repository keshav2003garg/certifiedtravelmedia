import db from '@/db';

import { and, eq, gte, inArray, lt, lte, or } from 'drizzle-orm';

import HttpError from '@repo/server-utils/errors/http-error';

import * as schema from '@services/database/schemas';

export type PlacementType = 'BROCH' | 'MAG';

export interface Placement {
  brochureName: string;
  customerName: string | null;
  type: PlacementType;
  tier: 'Premium Placement' | 'Normal Placement';
  size: { cols: number; rows: number };
  position: { col: number; row: number };
  contractEndDate: string;
  contractId: string;
  isNew: boolean;
}

export interface Removal {
  brochureName: string;
  type: PlacementType;
  expiredDate: string;
  size: { cols: number; rows: number };
  position: { col: number; row: number };
  contractId: string;
}

export interface FillChartResult {
  location: {
    id: string;
    name: string;
    address: string;
    pockets: { width: number; height: number };
  };
  month: number;
  year: number;
  placements: Placement[];
  removals: Removal[];
}

export const PLACEMENT_SIZES = {
  BROCH: { cols: 1, rows: 1 },
  MAG: { cols: 2, rows: 1 },
} as const satisfies Record<PlacementType, { cols: number; rows: number }>;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getMonthDateRange(month: number, year: number) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const pad = (value: number) => String(value).padStart(2, '0');

  return {
    firstDayStr: `${year}-${pad(month)}-${pad(firstDay.getDate())}`,
    lastDayStr: `${year}-${pad(month)}-${pad(lastDay.getDate())}`,
  };
}

function getPreviousMonthDateRange(month: number, year: number) {
  if (month === 1) return getMonthDateRange(12, year - 1);
  return getMonthDateRange(month - 1, year);
}

function getBrochureName(distribution: {
  description: string | null;
  customerName: string | null;
}) {
  return distribution.description || distribution.customerName || '';
}

function getBrochureKey(distribution: {
  description: string | null;
  customerName: string | null;
}) {
  return getBrochureName(distribution).toLowerCase();
}

function getDistributionKey(distribution: {
  customerId: string | null;
  description: string | null;
  customerName: string | null;
  unitOfMeasure: PlacementType;
}) {
  return `${distribution.customerId}|${getBrochureKey(distribution)}|${distribution.unitOfMeasure}`;
}

function getPlacementPriority(
  type: PlacementType,
  isNew: boolean,
  isPremium: boolean,
) {
  if (type === 'MAG') {
    if (isNew && isPremium) return 0;
    if (isNew && !isPremium) return 1;
    if (!isNew && isPremium) return 2;
    return 3;
  }

  if (isNew && isPremium) return 4;
  if (!isNew && isPremium) return 5;
  if (isNew && !isPremium) return 6;
  return 7;
}

function buildEmptyResult(
  location: typeof schema.locations.$inferSelect,
  month: number,
  year: number,
): FillChartResult {
  return {
    location: {
      id: location.id,
      name: location.name,
      address: location.address,
      pockets: location.pockets,
    },
    month,
    year,
    placements: [],
    removals: [],
  };
}

export async function getFillChart(
  locationId: string,
  month: number,
  year: number,
  sectorId?: string,
): Promise<FillChartResult> {
  const isUuid = UUID_REGEX.test(locationId);
  const location = await db.query.locations.findFirst({
    where: isUuid
      ? or(
          eq(schema.locations.locationId, locationId),
          eq(schema.locations.id, locationId),
        )
      : eq(schema.locations.locationId, locationId),
  });

  if (!location) {
    throw new HttpError(404, 'Location not found', 'NOT_FOUND');
  }

  const locationSectorRows = await db
    .select({ sectorId: schema.locationsSectors.sectorId })
    .from(schema.locationsSectors)
    .where(eq(schema.locationsSectors.locationId, location.id));

  const locationSectorIds = locationSectorRows.map((row) => row.sectorId);
  const sectorIds = sectorId
    ? locationSectorIds.filter((id) => id === sectorId)
    : locationSectorIds;

  if (sectorIds.length === 0) {
    return buildEmptyResult(location, month, year);
  }

  const { firstDayStr, lastDayStr } = getMonthDateRange(month, year);
  const prevMonthRange = getPreviousMonthDateRange(month, year);

  const activeDistributions = await db
    .select({
      unitOfMeasure: schema.contractDistributions.unitOfMeasure,
      beginningDate: schema.contractDistributions.beginningDate,
      endingDate: schema.contractDistributions.endingDate,
      description: schema.contractDistributions.description,
      customerName: schema.customers.name,
      tier: schema.contracts.tier,
      acumaticaContractId: schema.contracts.acumaticaContractId,
      customerId: schema.contracts.customerUuid,
    })
    .from(schema.contractDistributions)
    .innerJoin(
      schema.contracts,
      eq(schema.contractDistributions.contractId, schema.contracts.id),
    )
    .leftJoin(
      schema.customers,
      eq(schema.contracts.customerUuid, schema.customers.id),
    )
    .where(
      and(
        inArray(schema.contractDistributions.sectorId, sectorIds),
        lte(schema.contractDistributions.beginningDate, lastDayStr),
        gte(schema.contractDistributions.endingDate, firstDayStr),
        eq(schema.contracts.status, 'Open'),
      ),
    );

  const expiredDistributions = await db
    .select({
      unitOfMeasure: schema.contractDistributions.unitOfMeasure,
      endingDate: schema.contractDistributions.endingDate,
      description: schema.contractDistributions.description,
      customerName: schema.customers.name,
      acumaticaContractId: schema.contracts.acumaticaContractId,
      customerId: schema.contracts.customerUuid,
    })
    .from(schema.contractDistributions)
    .innerJoin(
      schema.contracts,
      eq(schema.contractDistributions.contractId, schema.contracts.id),
    )
    .leftJoin(
      schema.customers,
      eq(schema.contracts.customerUuid, schema.customers.id),
    )
    .where(
      and(
        inArray(schema.contractDistributions.sectorId, sectorIds),
        lte(
          schema.contractDistributions.beginningDate,
          prevMonthRange.lastDayStr,
        ),
        gte(
          schema.contractDistributions.endingDate,
          prevMonthRange.firstDayStr,
        ),
        lt(schema.contractDistributions.endingDate, firstDayStr),
        eq(schema.contracts.status, 'Open'),
      ),
    );

  const priorCustomerRows = await db
    .selectDistinct({ customerId: schema.contracts.customerUuid })
    .from(schema.contractDistributions)
    .innerJoin(
      schema.contracts,
      eq(schema.contractDistributions.contractId, schema.contracts.id),
    )
    .where(lt(schema.contractDistributions.beginningDate, firstDayStr));

  const previouslyActiveCustomers = new Set(
    priorCustomerRows.map((row) => row.customerId),
  );

  const isGenuinelyNew = (distribution: (typeof activeDistributions)[number]) =>
    !previouslyActiveCustomers.has(distribution.customerId);

  const sortedDistributions = activeDistributions.sort((left, right) => {
    const leftPriority = getPlacementPriority(
      left.unitOfMeasure,
      isGenuinelyNew(left),
      left.tier === 'Premium Placement',
    );
    const rightPriority = getPlacementPriority(
      right.unitOfMeasure,
      isGenuinelyNew(right),
      right.tier === 'Premium Placement',
    );

    if (leftPriority !== rightPriority) return leftPriority - rightPriority;

    return getBrochureName(left).localeCompare(getBrochureName(right));
  });

  const bestByKey = new Map<string, (typeof sortedDistributions)[number]>();
  for (const distribution of sortedDistributions) {
    const key = getDistributionKey(distribution);
    const existing = bestByKey.get(key);
    if (!existing || distribution.endingDate > existing.endingDate) {
      bestByKey.set(key, distribution);
    }
  }

  const uniqueDistributions = sortedDistributions.filter(
    (distribution) =>
      bestByKey.get(getDistributionKey(distribution)) === distribution,
  );

  const pockets = location.pockets;
  const gridWidth = pockets.width;
  const gridHeight = pockets.height;
  const placements: Placement[] = [];

  let currentCol = 0;
  let currentRow = 0;

  for (const distribution of uniqueDistributions) {
    const size = PLACEMENT_SIZES[distribution.unitOfMeasure];

    if (currentCol + size.cols > gridWidth) {
      currentCol = 0;
      currentRow += 1;
    }

    if (currentRow + size.rows > gridHeight) {
      break;
    }

    placements.push({
      brochureName: getBrochureName(distribution),
      customerName: distribution.customerName ?? null,
      type: distribution.unitOfMeasure,
      tier: distribution.tier,
      size: { ...size },
      position: { col: currentCol, row: currentRow },
      contractEndDate: distribution.endingDate,
      contractId: distribution.acumaticaContractId || '',
      isNew: isGenuinelyNew(distribution),
    });

    currentCol += size.cols;
  }

  const activeBrochureKeys = new Set<string>();
  for (const distribution of uniqueDistributions) {
    activeBrochureKeys.add(
      `${getBrochureKey(distribution)}|${distribution.unitOfMeasure}|${distribution.customerId}`,
    );
  }

  const filteredExpired = expiredDistributions.filter((distribution) => {
    const key = `${getBrochureKey(distribution)}|${distribution.unitOfMeasure}|${distribution.customerId}`;
    return !activeBrochureKeys.has(key);
  });

  const bestExpiredByKey = new Map<string, (typeof filteredExpired)[number]>();
  for (const distribution of filteredExpired) {
    const key = getDistributionKey(distribution);
    const existing = bestExpiredByKey.get(key);
    if (!existing || distribution.endingDate > existing.endingDate) {
      bestExpiredByKey.set(key, distribution);
    }
  }

  const uniqueExpiredDistributions = filteredExpired.filter(
    (distribution) =>
      bestExpiredByKey.get(getDistributionKey(distribution)) === distribution,
  );

  const removals: Removal[] = [];

  for (const distribution of uniqueExpiredDistributions) {
    const size = PLACEMENT_SIZES[distribution.unitOfMeasure];

    if (currentCol + size.cols > gridWidth) {
      currentCol = 0;
      currentRow += 1;
    }

    if (currentRow + size.rows > gridHeight) {
      continue;
    }

    removals.push({
      brochureName: getBrochureName(distribution),
      type: distribution.unitOfMeasure,
      expiredDate: distribution.endingDate,
      size: { ...size },
      position: { col: currentCol, row: currentRow },
      contractId: distribution.acumaticaContractId || '',
    });

    currentCol += size.cols;
  }

  return {
    location: {
      id: location.id,
      name: location.name,
      address: location.address,
      pockets,
    },
    month,
    year,
    placements,
    removals,
  };
}
