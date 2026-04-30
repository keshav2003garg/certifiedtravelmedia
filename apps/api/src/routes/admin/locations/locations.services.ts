import { env } from '@repo/env/server';
import db from '@/db';

import { and, asc, count, desc, eq, inArray, or, sql } from 'drizzle-orm';

import HttpError from '@repo/server-utils/errors/http-error';
import {
  createPaginatedResult,
  getPaginationOffset,
} from '@repo/server-utils/utils/pagination';

import {
  locations,
  locationsSectors,
  sectors,
} from '@services/database/schemas';

import type { SQL } from 'drizzle-orm';
import type {
  ListLocationsBySectorParams,
  ListLocationsParams,
  LocationWithChart,
  SectorWithLocations,
} from './locations.types';

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

class LocationsService {
  private pocketWidth = sql<number>`(${locations.pockets}->>'width')::int`;
  private pocketHeight = sql<number>`(${locations.pockets}->>'height')::int`;

  private buildChartUrl(
    location: Pick<LocationWithChart, 'id' | 'locationId'>,
  ) {
    return `${env.CHARTS_APP_URL}/location/${location.locationId ?? location.id}`;
  }

  private normalizeLocation(row: typeof locations.$inferSelect) {
    const pockets = row.pockets;

    return {
      ...row,
      pockets: {
        width: Number.isFinite(pockets.width) ? pockets.width : 0,
        height: Number.isFinite(pockets.height) ? pockets.height : 0,
      },
    };
  }

  private buildLocationSearchCondition(search: string) {
    const term = `%${escapeLike(search)}%`;
    const matchingSectorLocationIds = db
      .select({ locationId: locationsSectors.locationId })
      .from(locationsSectors)
      .innerJoin(sectors, eq(locationsSectors.sectorId, sectors.id))
      .where(
        or(
          sql`${sectors.acumaticaId} ILIKE ${term} ESCAPE '\\'`,
          sql`${sectors.description} ILIKE ${term} ESCAPE '\\'`,
        ),
      );

    return or(
      sql`${locations.locationId} ILIKE ${term} ESCAPE '\\'`,
      sql`${locations.airtableId} ILIKE ${term} ESCAPE '\\'`,
      sql`${locations.route4MeId} ILIKE ${term} ESCAPE '\\'`,
      sql`${locations.name} ILIKE ${term} ESCAPE '\\'`,
      sql`${locations.address} ILIKE ${term} ESCAPE '\\'`,
      sql`${locations.city} ILIKE ${term} ESCAPE '\\'`,
      sql`${locations.state} ILIKE ${term} ESCAPE '\\'`,
      sql`${locations.zip} ILIKE ${term} ESCAPE '\\'`,
      inArray(locations.id, matchingSectorLocationIds),
    )!;
  }

  private buildLocationWhereClause(params: ListLocationsParams) {
    const conditions: SQL[] = [];

    if (params.search) {
      conditions.push(this.buildLocationSearchCondition(params.search));
    }

    if (params.sectorId) {
      const matchingLocationIds = db
        .select({ locationId: locationsSectors.locationId })
        .from(locationsSectors)
        .where(eq(locationsSectors.sectorId, params.sectorId));

      conditions.push(inArray(locations.id, matchingLocationIds));
    }

    if (params.width !== undefined) {
      conditions.push(eq(this.pocketWidth, params.width));
    }

    if (params.height !== undefined) {
      conditions.push(eq(this.pocketHeight, params.height));
    }

    if (params.isDefaultPockets !== undefined) {
      conditions.push(eq(locations.isDefaultPockets, params.isDefaultPockets));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  private getLocationOrderBy(params: ListLocationsParams) {
    const sortBy = params.sortBy ?? 'name';
    const order = params.order ?? 'asc';

    const columns =
      sortBy === 'locationId'
        ? [locations.locationId, locations.name]
        : sortBy === 'city'
          ? [locations.city, locations.name]
          : sortBy === 'state'
            ? [locations.state, locations.city, locations.name]
            : sortBy === 'pocketSize'
              ? [this.pocketWidth, this.pocketHeight, locations.name]
              : [locations.name, locations.city];

    return order === 'desc'
      ? [...columns.map((column) => desc(column)), desc(locations.id)]
      : [...columns.map((column) => asc(column)), asc(locations.id)];
  }

  private async getSectorsByLocationId(locationIds: string[]) {
    const sectorsByLocationId = new Map<
      string,
      { id: string; acumaticaId: string; description: string }[]
    >();

    if (locationIds.length === 0) {
      return sectorsByLocationId;
    }

    const rows = await db
      .select({
        locationId: locationsSectors.locationId,
        id: sectors.id,
        acumaticaId: sectors.acumaticaId,
        description: sectors.description,
      })
      .from(locationsSectors)
      .innerJoin(sectors, eq(locationsSectors.sectorId, sectors.id))
      .where(inArray(locationsSectors.locationId, locationIds))
      .orderBy(asc(sectors.acumaticaId));

    for (const row of rows) {
      const current = sectorsByLocationId.get(row.locationId) ?? [];
      current.push({
        id: row.id,
        acumaticaId: row.acumaticaId,
        description: row.description,
      });
      sectorsByLocationId.set(row.locationId, current);
    }

    return sectorsByLocationId;
  }

  private toLocationResult(
    row: typeof locations.$inferSelect,
    sectorsForLocation: {
      id: string;
      acumaticaId: string;
      description: string;
    }[],
  ): LocationWithChart {
    const location = this.normalizeLocation(row);

    return {
      id: location.id,
      airtableId: location.airtableId,
      locationId: location.locationId,
      name: location.name,
      address: location.address,
      city: location.city,
      state: location.state,
      zip: location.zip,
      pockets: location.pockets,
      isDefaultPockets: location.isDefaultPockets,
      route4MeId: location.route4MeId,
      sectors: sectorsForLocation,
      sectorCount: sectorsForLocation.length,
      chartUrl: this.buildChartUrl(location),
    };
  }

  async getStats() {
    const [locationsCount, sectorsCount, assignedCount, defaultPocketCount] =
      await Promise.all([
        db.select({ total: count() }).from(locations),
        db.select({ total: count() }).from(sectors),
        db
          .select({
            total:
              sql<number>`COUNT(DISTINCT ${locationsSectors.locationId})`.mapWith(
                Number,
              ),
          })
          .from(locationsSectors),
        db
          .select({ total: count() })
          .from(locations)
          .where(eq(locations.isDefaultPockets, true)),
      ]);

    const totalLocations = locationsCount[0]?.total ?? 0;
    const assignedLocations = assignedCount[0]?.total ?? 0;

    return {
      totalLocations,
      totalSectors: sectorsCount[0]?.total ?? 0,
      assignedLocations,
      unassignedLocations: Math.max(totalLocations - assignedLocations, 0),
      defaultPocketLocations: defaultPocketCount[0]?.total ?? 0,
    };
  }

  async list(params: ListLocationsParams) {
    const whereClause = this.buildLocationWhereClause(params);

    const [countRows, rows] = await Promise.all([
      db.select({ total: count() }).from(locations).where(whereClause),
      db
        .select()
        .from(locations)
        .where(whereClause)
        .orderBy(...this.getLocationOrderBy(params))
        .limit(params.limit)
        .offset(getPaginationOffset(params)),
    ]);

    const sectorsByLocationId = await this.getSectorsByLocationId(
      rows.map((row) => row.id),
    );

    return createPaginatedResult({
      data: rows.map((row) =>
        this.toLocationResult(row, sectorsByLocationId.get(row.id) ?? []),
      ),
      page: params.page,
      limit: params.limit,
      total: countRows[0]?.total ?? 0,
    });
  }

  private buildSectorSearchWhereClause(params: ListLocationsBySectorParams) {
    const conditions: SQL[] = [];

    if (params.search) {
      const term = `%${escapeLike(params.search)}%`;
      const matchingSectorIds = db
        .select({ sectorId: locationsSectors.sectorId })
        .from(locationsSectors)
        .innerJoin(locations, eq(locationsSectors.locationId, locations.id))
        .where(this.buildLocationSearchCondition(params.search));

      conditions.push(
        or(
          sql`${sectors.acumaticaId} ILIKE ${term} ESCAPE '\\'`,
          sql`${sectors.description} ILIKE ${term} ESCAPE '\\'`,
          inArray(sectors.id, matchingSectorIds),
        )!,
      );
    }

    if (params.sectorId) {
      conditions.push(eq(sectors.id, params.sectorId));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  private getSectorOrderBy(params: ListLocationsBySectorParams) {
    const sortBy = params.sortBy ?? 'acumaticaId';
    const order = params.order ?? 'asc';
    const locationCount = sql<number>`COUNT(${locationsSectors.locationId})`;
    const columns =
      sortBy === 'description'
        ? [sectors.description, sectors.acumaticaId]
        : sortBy === 'locationCount'
          ? [locationCount, sectors.acumaticaId]
          : [sectors.acumaticaId, sectors.description];

    return order === 'desc'
      ? [...columns.map((column) => desc(column)), desc(sectors.id)]
      : [...columns.map((column) => asc(column)), asc(sectors.id)];
  }

  private buildGroupedLocationWhereClause(
    params: ListLocationsBySectorParams,
    sectorIds: string[],
  ) {
    const conditions: SQL[] = [inArray(locationsSectors.sectorId, sectorIds)];

    if (params.search) {
      conditions.push(this.buildLocationSearchCondition(params.search));
    }

    if (params.width !== undefined) {
      conditions.push(eq(this.pocketWidth, params.width));
    }

    if (params.height !== undefined) {
      conditions.push(eq(this.pocketHeight, params.height));
    }

    if (params.isDefaultPockets !== undefined) {
      conditions.push(eq(locations.isDefaultPockets, params.isDefaultPockets));
    }

    return and(...conditions);
  }

  async listBySector(params: ListLocationsBySectorParams) {
    const whereClause = this.buildSectorSearchWhereClause(params);

    const [countRows, sectorRows] = await Promise.all([
      db.select({ total: count() }).from(sectors).where(whereClause),
      db
        .select({
          id: sectors.id,
          acumaticaId: sectors.acumaticaId,
          description: sectors.description,
          locationCount: count(locationsSectors.locationId),
        })
        .from(sectors)
        .leftJoin(locationsSectors, eq(locationsSectors.sectorId, sectors.id))
        .where(whereClause)
        .groupBy(sectors.id, sectors.acumaticaId, sectors.description)
        .orderBy(...this.getSectorOrderBy(params))
        .limit(params.limit)
        .offset(getPaginationOffset(params)),
    ]);

    if (sectorRows.length === 0) {
      return createPaginatedResult<SectorWithLocations>({
        data: [],
        page: params.page,
        limit: params.limit,
        total: countRows[0]?.total ?? 0,
      });
    }

    const sectorIds = sectorRows.map((sector) => sector.id);
    const locationRows = await db
      .select({
        sectorId: locationsSectors.sectorId,
        location: locations,
      })
      .from(locationsSectors)
      .innerJoin(locations, eq(locationsSectors.locationId, locations.id))
      .where(this.buildGroupedLocationWhereClause(params, sectorIds))
      .orderBy(asc(locations.name));

    const locationsBySectorId = new Map<string, LocationWithChart[]>();

    for (const row of locationRows) {
      const current = locationsBySectorId.get(row.sectorId) ?? [];
      const sector = sectorRows.find((item) => item.id === row.sectorId);

      if (!sector) continue;

      current.push(
        this.toLocationResult(row.location, [
          {
            id: sector.id,
            acumaticaId: sector.acumaticaId,
            description: sector.description,
          },
        ]),
      );
      locationsBySectorId.set(row.sectorId, current);
    }

    return createPaginatedResult({
      data: sectorRows.map((sector) => ({
        id: sector.id,
        acumaticaId: sector.acumaticaId,
        description: sector.description,
        locations: locationsBySectorId.get(sector.id) ?? [],
        locationCount: locationsBySectorId.get(sector.id)?.length ?? 0,
      })),
      page: params.page,
      limit: params.limit,
      total: countRows[0]?.total ?? 0,
    });
  }

  async getById(id: string) {
    const location = await db.query.locations.findFirst({
      where: eq(locations.id, id),
    });

    if (!location) {
      throw new HttpError(404, 'Location not found', 'NOT_FOUND');
    }

    const sectorsByLocationId = await this.getSectorsByLocationId([id]);

    return this.toLocationResult(location, sectorsByLocationId.get(id) ?? []);
  }
}

export const locationsService = new LocationsService();
