import { env } from '@repo/env/server';
import db from '@/db';

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  lt,
  lte,
  or,
  sql,
} from 'drizzle-orm';

import HttpError from '@repo/server-utils/errors/http-error';
import {
  createPaginatedResult,
  getPaginationOffset,
} from '@repo/server-utils/utils/pagination';
import { escapeCsv } from '@repo/utils/csv';

import * as schema from '@services/database/schemas';

import {
  getFillChart,
  type Placement,
  PLACEMENT_SIZES,
  type PlacementType,
} from '@/utils/fill-chart';

import type {
  ChartResult as PublicChartResult,
  ChartTile as PublicChartTile,
} from '@/routes/public/charts/charts.types';

import type { SQL } from 'drizzle-orm';
import type {
  ArchiveDetail,
  ArchiveListItem,
  ArchiveSnapshot,
  ChartInventoryItemResult,
  ChartLayoutResult,
  ChartLocationResult,
  ChartTileResult,
  CloneChartInput,
  ExportPocketsSoldReportParams,
  GetSectorChartParams,
  InitializeSectorChartInput,
  ListArchivesParams,
  ListChartsParams,
  ListChartsResult,
  SaveChartInput,
  SectorChartsResult,
  SectorStandSizeResult,
  TileInput,
} from './charts.types';

type ChartTileInsert = typeof schema.chartTiles.$inferInsert;
type Sector = typeof schema.sectors.$inferSelect;
type Location = typeof schema.locations.$inferSelect;

const MONTH_REPORT_COLUMNS = [
  { month: 1, label: 'Jan' },
  { month: 2, label: 'Feb' },
  { month: 3, label: 'Mar' },
  { month: 4, label: 'Apr' },
  { month: 5, label: 'May' },
  { month: 6, label: 'Jun' },
  { month: 7, label: 'Jul' },
  { month: 8, label: 'Aug' },
  { month: 9, label: 'Sep' },
  { month: 10, label: 'Oct' },
  { month: 11, label: 'Nov' },
  { month: 12, label: 'Dec' },
] as const;

const POCKETS_SOLD_EXPORT_HEADERS = [
  'Report Year',
  'Sector ID',
  'Sector Name',
  'Stand Size',
  'Pockets',
  'Locations',
  ...MONTH_REPORT_COLUMNS.map((column) => column.label),
] as const;

type ChartTileWithRelations = typeof schema.chartTiles.$inferSelect & {
  contract:
    | (typeof schema.contracts.$inferSelect & {
        customer: typeof schema.customers.$inferSelect | null;
      })
    | null;
};

type ChartLayoutWithRelations = typeof schema.chartLayouts.$inferSelect & {
  sector: Sector | null;
  tiles: ChartTileWithRelations[];
};

interface LocationRow {
  sectorId: string;
  locationInternalId: string;
  locationId: string | null;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  pockets: { width: number; height: number };
  width: number;
  height: number;
  chartLayoutId: string | null;
  chartStatus: 'Draft' | 'Completed' | 'Archived' | null;
  locked: boolean | null;
}

interface InventoryItemRow {
  id: string;
  warehouseId: string;
  warehouseName: string;
  warehouseAcumaticaId: string | null;
  brochureTypeId: string;
  brochureTypeName: string;
  brochureId: string;
  brochureName: string;
  coverPhotoUrl: string | null;
  unitsPerBox: number;
  boxes: number;
  stockLevel: string;
  colSpan: number;
  customerName: string | null;
}

interface PocketsSoldStandSizeRow {
  sectorId: string;
  sectorAcumaticaId: string;
  sectorDescription: string;
  standWidth: number;
  standHeight: number;
  locationCount: number;
  monthlyOccupiedTiles: Record<number, number>;
}

interface ContractDistributionReportRow {
  sectorId: string;
  unitOfMeasure: PlacementType;
  beginningDate: string;
  endingDate: string;
  description: string | null;
  customerName: string | null;
  tier: 'Premium Placement' | 'Normal Placement';
  customerId: string | null;
}

type PocketsSoldCsvRow = Record<
  (typeof POCKETS_SOLD_EXPORT_HEADERS)[number],
  string
>;

class ChartsService {
  private async getLayoutById(id: string) {
    const layout = await db.query.chartLayouts.findFirst({
      where: eq(schema.chartLayouts.id, id),
      with: {
        sector: true,
        tiles: {
          with: {
            contract: {
              with: {
                customer: true,
              },
            },
          },
        },
      },
    });

    if (!layout) {
      throw new HttpError(404, 'Chart layout not found', 'NOT_FOUND');
    }

    return layout;
  }

  private async getSectorOrThrow(sectorId: string) {
    const sector = await db.query.sectors.findFirst({
      where: eq(schema.sectors.id, sectorId),
    });

    if (!sector) {
      throw new HttpError(404, 'Sector not found', 'NOT_FOUND');
    }

    return sector;
  }

  private escapeLike(value: string) {
    return value.replace(/[\\%_]/g, '\\$&');
  }

  private buildSearchWhere(search?: string) {
    if (!search) return undefined;

    const term = `%${this.escapeLike(search)}%`;

    return or(
      ilike(schema.sectors.acumaticaId, term),
      ilike(schema.sectors.description, term),
      ilike(schema.locations.locationId, term),
      ilike(schema.locations.name, term),
      ilike(schema.locations.address, term),
      ilike(schema.locations.city, term),
      ilike(schema.locations.state, term),
      ilike(schema.locations.zip, term),
    );
  }

  private sectorMatchesSearch(sector: Sector, search?: string) {
    if (!search) return false;

    const term = search.toLowerCase();
    return (
      sector.acumaticaId.toLowerCase().includes(term) ||
      sector.description.toLowerCase().includes(term)
    );
  }

  private locationMatchesSearch(location: LocationRow, search?: string) {
    if (!search) return false;

    const term = search.toLowerCase();
    return [
      location.locationId,
      location.name,
      location.address,
      location.city,
      location.state,
      location.zip,
    ].some((value) => value?.toLowerCase().includes(term));
  }

  private buildLocationChartUrl(location: Pick<Location, 'id' | 'locationId'>) {
    return `${env.CHARTS_APP_URL}/location/${encodeURIComponent(location.locationId ?? location.id)}`;
  }

  private inventorySelectFields() {
    return {
      id: schema.inventoryItems.id,
      warehouseId: schema.warehouses.id,
      warehouseName: schema.warehouses.name,
      warehouseAcumaticaId: schema.warehouses.acumaticaId,
      brochureTypeId: schema.brochureTypes.id,
      brochureTypeName: schema.brochureTypes.name,
      brochureId: schema.brochures.id,
      brochureName: schema.brochures.name,
      coverPhotoUrl: schema.brochureImages.imageUrl,
      unitsPerBox: schema.brochureImagePackSizes.unitsPerBox,
      boxes: schema.inventoryItems.boxes,
      stockLevel: schema.inventoryItems.stockLevel,
      colSpan: schema.brochureTypes.colSpan,
      customerName: schema.customers.name,
    };
  }

  private inventoryBaseQuery() {
    return db
      .select(this.inventorySelectFields())
      .from(schema.inventoryItems)
      .innerJoin(
        schema.warehouses,
        eq(schema.inventoryItems.warehouseId, schema.warehouses.id),
      )
      .innerJoin(
        schema.brochureImagePackSizes,
        eq(
          schema.inventoryItems.brochureImagePackSizeId,
          schema.brochureImagePackSizes.id,
        ),
      )
      .innerJoin(
        schema.brochureImages,
        eq(
          schema.brochureImagePackSizes.brochureImageId,
          schema.brochureImages.id,
        ),
      )
      .innerJoin(
        schema.brochures,
        eq(schema.brochureImages.brochureId, schema.brochures.id),
      )
      .innerJoin(
        schema.brochureTypes,
        eq(schema.brochures.brochureTypeId, schema.brochureTypes.id),
      )
      .leftJoin(
        schema.customers,
        eq(schema.brochures.customerId, schema.customers.id),
      );
  }

  private formatInventoryItem(row: InventoryItemRow): ChartInventoryItemResult {
    return {
      id: row.id,
      warehouseId: row.warehouseId,
      warehouseName: row.warehouseName,
      warehouseAcumaticaId: row.warehouseAcumaticaId,
      brochureTypeId: row.brochureTypeId,
      brochureTypeName: row.brochureTypeName,
      brochureId: row.brochureId,
      brochureName: row.brochureName,
      coverPhotoUrl: row.coverPhotoUrl,
      unitsPerBox: row.unitsPerBox,
      boxes: row.boxes,
      stockLevel: row.stockLevel,
      colSpan: row.colSpan,
      customerName: row.customerName,
    };
  }

  private getInventoryItemIds(tiles: ChartTileWithRelations[]) {
    return [
      ...new Set(tiles.map((tile) => tile.inventoryItemId).filter(Boolean)),
    ] as string[];
  }

  private async getInventoryDetailsByIds(ids: string[]) {
    if (ids.length === 0) return new Map<string, ChartInventoryItemResult>();

    const rows = await this.inventoryBaseQuery()
      .where(inArray(schema.inventoryItems.id, ids))
      .orderBy(
        asc(schema.warehouses.name),
        asc(schema.brochures.name),
        asc(schema.brochureTypes.name),
      );

    return new Map(rows.map((row) => [row.id, this.formatInventoryItem(row)]));
  }

  private async getSectorInventoryItems(sectorId: string) {
    const rows = await this.inventoryBaseQuery()
      .innerJoin(
        schema.warehousesSectors,
        and(
          eq(schema.warehousesSectors.warehouseId, schema.warehouses.id),
          eq(schema.warehousesSectors.sectorId, sectorId),
        ),
      )
      .where(
        and(
          eq(schema.warehouses.isActive, true),
          gt(schema.inventoryItems.boxes, 0),
        ),
      )
      .orderBy(
        asc(schema.warehouses.name),
        asc(schema.brochures.name),
        asc(schema.brochureTypes.name),
      );

    return rows.map((row) => this.formatInventoryItem(row));
  }

  private formatLocation(
    location: LocationRow,
    matchesSearch: boolean,
  ): ChartLocationResult {
    return {
      id: location.locationInternalId,
      locationId: location.locationId,
      name: location.name,
      address: location.address,
      city: location.city,
      state: location.state,
      zip: location.zip,
      pockets: location.pockets,
      chartUrl: this.buildLocationChartUrl({
        id: location.locationInternalId,
        locationId: location.locationId,
      }),
      matchesSearch,
    };
  }

  private ensureEditable(layout: ChartLayoutWithRelations) {
    if (layout.status === 'Archived') {
      throw new HttpError(
        400,
        'Archived charts cannot be edited',
        'BAD_REQUEST',
      );
    }

    if (layout.locked) {
      throw new HttpError(
        400,
        'Chart is locked and cannot be edited',
        'BAD_REQUEST',
      );
    }

    this.ensureNotPastMonth(layout);
  }

  private ensureNotPastMonth(layout: { month: number; year: number }) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (
      layout.year < currentYear ||
      (layout.year === currentYear && layout.month < currentMonth)
    ) {
      throw new HttpError(
        400,
        'Charts from previous months cannot be edited',
        'BAD_REQUEST',
      );
    }
  }

  private getNextMonthYear(month: number, year: number) {
    if (month === 12) {
      return { nextMonth: 1, nextYear: year + 1 };
    }

    return { nextMonth: month + 1, nextYear: year };
  }

  private formatTiles(
    tiles: ChartTileWithRelations[],
    inventoryById: Map<string, ChartInventoryItemResult>,
  ): ChartTileResult[] {
    return [...tiles]
      .sort((a, b) => a.row - b.row || a.col - b.col)
      .map((tile) => {
        const inventory = tile.inventoryItemId
          ? inventoryById.get(tile.inventoryItemId)
          : null;

        return {
          id: tile.id,
          col: tile.col,
          row: tile.row,
          colSpan: tile.colSpan,
          tileType: tile.tileType,
          warehouseId: inventory?.warehouseId ?? null,
          warehouseName: inventory?.warehouseName ?? null,
          warehouseAcumaticaId: inventory?.warehouseAcumaticaId ?? null,
          brochureTypeId: inventory?.brochureTypeId ?? null,
          brochureTypeName: inventory?.brochureTypeName ?? null,
          brochureId: inventory?.brochureId ?? null,
          brochureName: inventory?.brochureName ?? null,
          inventoryItemId: tile.inventoryItemId,
          contractId: tile.contractId,
          label: tile.label ?? inventory?.brochureName ?? null,
          coverPhotoUrl: tile.coverPhotoUrl ?? inventory?.coverPhotoUrl ?? null,
          unitsPerBox: inventory?.unitsPerBox ?? null,
          boxes: inventory?.boxes ?? null,
          stockLevel: inventory?.stockLevel ?? null,
          isNew: tile.isNew,
          isFlagged: tile.isFlagged,
          flagNote: tile.flagNote,
          tier: tile.contract?.tier ?? null,
          contractEndDate: tile.contract?.endDate ?? null,
          customerName:
            tile.contract?.customer?.name ?? inventory?.customerName ?? null,
          acumaticaContractId: tile.contract?.acumaticaContractId ?? null,
        };
      });
  }

  private buildChartLayoutResult(
    layout: ChartLayoutWithRelations,
    options: {
      locationCount?: number;
      inventoryById: Map<string, ChartInventoryItemResult>;
      availableInventory: ChartInventoryItemResult[];
      paidTiles: ChartTileResult[];
    },
  ): ChartLayoutResult {
    const tiles = this.formatTiles(layout.tiles, options.inventoryById);

    return {
      id: layout.id,
      sectorId: layout.sectorId,
      sectorDescription: layout.sector?.description ?? null,
      sectorAcumaticaId: layout.sector?.acumaticaId ?? null,
      standWidth: layout.standWidth,
      standHeight: layout.standHeight,
      displayName: `${layout.sector?.acumaticaId ?? 'Sector'} - ${layout.standWidth}x${layout.standHeight}`,
      displayDescription: layout.sector?.description ?? null,
      month: layout.month,
      year: layout.year,
      status: layout.status,
      locked: layout.locked,
      generalNotes: layout.generalNotes,
      gridSize: { width: layout.standWidth, height: layout.standHeight },
      completedAt: layout.completedAt,
      completedBy: layout.completedBy,
      archivedAt: layout.archivedAt,
      archivedBy: layout.archivedBy,
      createdAt: layout.createdAt,
      updatedAt: layout.updatedAt,
      persisted: true,
      locationCount: options.locationCount ?? 0,
      availableInventory: options.availableInventory,
      paidTiles: options.paidTiles,
      tiles,
    };
  }

  private getPaidTileKey(tile: ChartTileResult) {
    return (
      tile.contractId ??
      tile.acumaticaContractId ??
      `${tile.label ?? 'paid'}:${tile.colSpan}`
    );
  }

  private mergePaidTileCatalog(...sources: ChartTileResult[][]) {
    const tilesByKey = new Map<string, ChartTileResult>();

    for (const source of sources) {
      for (const tile of source) {
        if (tile.tileType !== 'Paid') continue;
        tilesByKey.set(this.getPaidTileKey(tile), tile);
      }
    }

    return Array.from(tilesByKey.values()).sort(
      (a, b) =>
        a.row - b.row ||
        a.col - b.col ||
        a.label?.localeCompare(b.label ?? '') ||
        0,
    );
  }

  private async getGeneratedPaidTileCatalog(
    layout: Pick<
      ChartLayoutWithRelations,
      'sectorId' | 'standWidth' | 'standHeight' | 'month' | 'year'
    >,
  ) {
    const [primaryLocation] = await this.getMatchingSectorLocations(
      layout.sectorId,
      layout.standWidth,
      layout.standHeight,
    );

    if (!primaryLocation) return [];

    return this.buildPreviewTiles(
      primaryLocation.id,
      layout.sectorId,
      layout.month,
      layout.year,
    );
  }

  private async formatResponse(
    layout: ChartLayoutWithRelations,
    extra: { locationCount?: number } = {},
  ): Promise<ChartLayoutResult> {
    const [inventoryById, availableInventory, generatedPaidTiles] =
      await Promise.all([
        this.getInventoryDetailsByIds(this.getInventoryItemIds(layout.tiles)),
        this.getSectorInventoryItems(layout.sectorId),
        this.getGeneratedPaidTileCatalog(layout),
      ]);
    const formattedTiles = this.formatTiles(layout.tiles, inventoryById);

    return this.buildChartLayoutResult(layout, {
      ...extra,
      inventoryById,
      availableInventory,
      paidTiles: this.mergePaidTileCatalog(generatedPaidTiles, formattedTiles),
    });
  }

  private normalizeTileInput(chartLayoutId: string, tile: TileInput) {
    return {
      chartLayoutId,
      col: tile.col,
      row: tile.row,
      colSpan: tile.colSpan ?? 1,
      tileType: tile.tileType,
      inventoryItemId: tile.inventoryItemId ?? null,
      contractId: tile.contractId ?? null,
      label: tile.label || null,
      coverPhotoUrl: tile.coverPhotoUrl || null,
      isNew: tile.isNew ?? false,
      isFlagged: tile.isFlagged ?? false,
      flagNote: tile.flagNote || null,
    } satisfies ChartTileInsert;
  }

  private copyTileToLayout(
    chartLayoutId: string,
    tile: ChartTileWithRelations,
  ) {
    return {
      chartLayoutId,
      col: tile.col,
      row: tile.row,
      colSpan: tile.colSpan,
      tileType: tile.tileType,
      inventoryItemId: tile.inventoryItemId,
      contractId: tile.contractId,
      label: tile.label,
      coverPhotoUrl: tile.coverPhotoUrl,
      isNew: tile.isNew,
      isFlagged: tile.isFlagged,
      flagNote: tile.flagNote,
    } satisfies ChartTileInsert;
  }

  private validateTilePlacements(
    layout: { standWidth: number; standHeight: number },
    tiles: Array<Pick<TileInput, 'id' | 'col' | 'row' | 'colSpan'>>,
  ) {
    const occupiedCells = new Map<string, string>();

    for (const [index, tile] of tiles.entries()) {
      const colSpan = tile.colSpan ?? 1;
      const owner = tile.id ?? `new:${index}`;

      if (
        tile.col + colSpan > layout.standWidth ||
        tile.row >= layout.standHeight
      ) {
        throw new HttpError(
          400,
          'Tile position exceeds chart grid bounds',
          'BAD_REQUEST',
        );
      }

      for (let col = tile.col; col < tile.col + colSpan; col += 1) {
        const key = `${col}:${tile.row}`;

        if (occupiedCells.has(key) && occupiedCells.get(key) !== owner) {
          throw new HttpError(
            400,
            'Tile positions cannot overlap',
            'BAD_REQUEST',
          );
        }

        occupiedCells.set(key, owner);
      }
    }
  }

  private async assertTileReferencesExist(
    tiles: TileInput[],
    sectorId: string,
  ) {
    const contractIds = [
      ...new Set(tiles.map((tile) => tile.contractId).filter(Boolean)),
    ] as string[];
    const inventoryItemIds = [
      ...new Set(tiles.map((tile) => tile.inventoryItemId).filter(Boolean)),
    ] as string[];

    const [contracts, inventoryItems] = await Promise.all([
      contractIds.length > 0
        ? db.query.contracts.findMany({
            where: inArray(schema.contracts.id, contractIds),
          })
        : [],
      inventoryItemIds.length > 0
        ? db
            .selectDistinct({ id: schema.inventoryItems.id })
            .from(schema.inventoryItems)
            .innerJoin(
              schema.warehousesSectors,
              and(
                eq(
                  schema.inventoryItems.warehouseId,
                  schema.warehousesSectors.warehouseId,
                ),
                eq(schema.warehousesSectors.sectorId, sectorId),
              ),
            )
            .where(inArray(schema.inventoryItems.id, inventoryItemIds))
        : [],
    ]);

    if (contracts.length !== contractIds.length) {
      throw new HttpError(
        400,
        'One or more contracts were not found',
        'BAD_REQUEST',
      );
    }

    if (inventoryItems.length !== inventoryItemIds.length) {
      throw new HttpError(
        400,
        'One or more inventory items are not linked to this sector',
        'BAD_REQUEST',
      );
    }
  }

  private async getLocationCount(
    sectorId: string,
    standWidth: number,
    standHeight: number,
  ) {
    const [result] = await db
      .select({ total: count() })
      .from(schema.locations)
      .innerJoin(
        schema.locationsSectors,
        eq(schema.locations.id, schema.locationsSectors.locationId),
      )
      .where(
        and(
          eq(schema.locationsSectors.sectorId, sectorId),
          sql`(${schema.locations.pockets}->>'width')::int = ${standWidth}`,
          sql`(${schema.locations.pockets}->>'height')::int = ${standHeight}`,
        ),
      );

    return result?.total ?? 0;
  }

  private getMonthDateRange(month: number, year: number) {
    const endDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const monthValue = String(month).padStart(2, '0');

    return {
      firstDay: `${year}-${monthValue}-01`,
      lastDay: `${year}-${monthValue}-${String(endDay).padStart(2, '0')}`,
    };
  }

  private getBrochureName(distribution: {
    description: string | null;
    customerName: string | null;
  }) {
    return distribution.description || distribution.customerName || '';
  }

  private getBrochureKey(distribution: {
    description: string | null;
    customerName: string | null;
  }) {
    return this.getBrochureName(distribution).toLowerCase();
  }

  private getDistributionKey(distribution: {
    customerId: string | null;
    description: string | null;
    customerName: string | null;
    unitOfMeasure: PlacementType;
  }) {
    return `${distribution.customerId}|${this.getBrochureKey(distribution)}|${distribution.unitOfMeasure}`;
  }

  private getPlacementPriority(
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

  private countGeneratedOccupiedTiles(params: {
    distributions: ContractDistributionReportRow[];
    previousCustomerIds: Set<string | null>;
    standWidth: number;
    standHeight: number;
  }) {
    const { distributions, previousCustomerIds, standHeight, standWidth } =
      params;
    const isGenuinelyNew = (distribution: ContractDistributionReportRow) =>
      !previousCustomerIds.has(distribution.customerId);

    const sortedDistributions = [...distributions].sort((left, right) => {
      const leftPriority = this.getPlacementPriority(
        left.unitOfMeasure,
        isGenuinelyNew(left),
        left.tier === 'Premium Placement',
      );
      const rightPriority = this.getPlacementPriority(
        right.unitOfMeasure,
        isGenuinelyNew(right),
        right.tier === 'Premium Placement',
      );

      if (leftPriority !== rightPriority) return leftPriority - rightPriority;

      return this.getBrochureName(left).localeCompare(
        this.getBrochureName(right),
      );
    });

    const bestByKey = new Map<string, ContractDistributionReportRow>();
    for (const distribution of sortedDistributions) {
      const key = this.getDistributionKey(distribution);
      const existing = bestByKey.get(key);

      if (!existing || distribution.endingDate > existing.endingDate) {
        bestByKey.set(key, distribution);
      }
    }

    const uniqueDistributions = sortedDistributions.filter(
      (distribution) =>
        bestByKey.get(this.getDistributionKey(distribution)) === distribution,
    );

    let currentCol = 0;
    let currentRow = 0;
    let occupiedTiles = 0;

    for (const distribution of uniqueDistributions) {
      const size = PLACEMENT_SIZES[distribution.unitOfMeasure];

      if (currentCol + size.cols > standWidth) {
        currentCol = 0;
        currentRow += 1;
      }

      if (currentRow + size.rows > standHeight) break;

      occupiedTiles += size.cols * size.rows;
      currentCol += size.cols;
    }

    return occupiedTiles;
  }

  private async getPocketsSoldReportRows(
    params: ExportPocketsSoldReportParams,
  ): Promise<PocketsSoldStandSizeRow[]> {
    const sectorWhereClause = this.buildSearchWhere(params.search);
    const sectorRows = await db
      .select({
        id: schema.sectors.id,
        acumaticaId: schema.sectors.acumaticaId,
        description: schema.sectors.description,
      })
      .from(schema.sectors)
      .innerJoin(
        schema.locationsSectors,
        eq(schema.locationsSectors.sectorId, schema.sectors.id),
      )
      .innerJoin(
        schema.locations,
        eq(schema.locations.id, schema.locationsSectors.locationId),
      )
      .where(sectorWhereClause)
      .groupBy(
        schema.sectors.id,
        schema.sectors.acumaticaId,
        schema.sectors.description,
      )
      .orderBy(asc(schema.sectors.acumaticaId));

    const sectorIds = sectorRows.map((sector) => sector.id);

    if (sectorIds.length === 0) return [];

    const standWidth = sql<number>`(${schema.locations.pockets}->>'width')::int`;
    const standHeight = sql<number>`(${schema.locations.pockets}->>'height')::int`;
    const [locationRows, layoutRows, distributionRows, priorCustomerRows] =
      await Promise.all([
        db
          .select({
            sectorId: schema.locationsSectors.sectorId,
            width: standWidth.mapWith(Number),
            height: standHeight.mapWith(Number),
          })
          .from(schema.locationsSectors)
          .innerJoin(
            schema.locations,
            eq(schema.locations.id, schema.locationsSectors.locationId),
          )
          .where(inArray(schema.locationsSectors.sectorId, sectorIds))
          .orderBy(schema.locationsSectors.sectorId, standWidth, standHeight),
        db
          .select({
            sectorId: schema.chartLayouts.sectorId,
            standWidth: schema.chartLayouts.standWidth,
            standHeight: schema.chartLayouts.standHeight,
            month: schema.chartLayouts.month,
            occupiedTiles:
              sql<number>`COALESCE(SUM(CASE WHEN ${schema.chartTiles.tileType} = 'Paid' THEN ${schema.chartTiles.colSpan} ELSE 0 END), 0)`.mapWith(
                Number,
              ),
          })
          .from(schema.chartLayouts)
          .leftJoin(
            schema.chartTiles,
            eq(schema.chartTiles.chartLayoutId, schema.chartLayouts.id),
          )
          .where(
            and(
              inArray(schema.chartLayouts.sectorId, sectorIds),
              eq(schema.chartLayouts.year, params.year),
            ),
          )
          .groupBy(
            schema.chartLayouts.sectorId,
            schema.chartLayouts.standWidth,
            schema.chartLayouts.standHeight,
            schema.chartLayouts.month,
          ),
        db
          .select({
            sectorId: schema.contractDistributions.sectorId,
            unitOfMeasure: schema.contractDistributions.unitOfMeasure,
            beginningDate: schema.contractDistributions.beginningDate,
            endingDate: schema.contractDistributions.endingDate,
            description: schema.contractDistributions.description,
            customerName: schema.customers.name,
            tier: schema.contracts.tier,
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
                `${params.year}-12-31`,
              ),
              gte(
                schema.contractDistributions.endingDate,
                `${params.year}-01-01`,
              ),
              eq(schema.contracts.status, 'Open'),
            ),
          ),
        db
          .selectDistinct({
            customerId: schema.contracts.customerUuid,
            beginningDate: schema.contractDistributions.beginningDate,
          })
          .from(schema.contractDistributions)
          .innerJoin(
            schema.contracts,
            eq(schema.contractDistributions.contractId, schema.contracts.id),
          )
          .where(
            lt(
              schema.contractDistributions.beginningDate,
              `${params.year + 1}-01-01`,
            ),
          ),
      ]);

    const sectorById = new Map(sectorRows.map((sector) => [sector.id, sector]));
    const rowsByKey = new Map<string, PocketsSoldStandSizeRow>();

    for (const location of locationRows) {
      const sector = sectorById.get(location.sectorId);
      if (!sector) continue;

      const key = `${location.sectorId}:${location.width}:${location.height}`;
      let row = rowsByKey.get(key);

      if (!row) {
        row = {
          sectorId: location.sectorId,
          sectorAcumaticaId: sector.acumaticaId,
          sectorDescription: sector.description,
          standWidth: location.width,
          standHeight: location.height,
          locationCount: 0,
          monthlyOccupiedTiles: {},
        };
        rowsByKey.set(key, row);
      }

      row.locationCount += 1;
    }

    const savedCountsByKey = new Map<string, number>();
    for (const layout of layoutRows) {
      savedCountsByKey.set(
        `${layout.sectorId}:${layout.standWidth}:${layout.standHeight}:${layout.month}`,
        layout.occupiedTiles,
      );
    }

    const distributionsBySectorMonth = new Map<
      string,
      ContractDistributionReportRow[]
    >();
    for (const distribution of distributionRows) {
      for (const { month } of MONTH_REPORT_COLUMNS) {
        const { firstDay, lastDay } = this.getMonthDateRange(
          month,
          params.year,
        );

        if (
          distribution.beginningDate <= lastDay &&
          distribution.endingDate >= firstDay
        ) {
          const key = `${distribution.sectorId}:${month}`;
          const distributions = distributionsBySectorMonth.get(key) ?? [];
          distributions.push(distribution);
          distributionsBySectorMonth.set(key, distributions);
        }
      }
    }

    const previousCustomerIdsByMonth = new Map<number, Set<string | null>>();
    for (const { month } of MONTH_REPORT_COLUMNS) {
      const { firstDay } = this.getMonthDateRange(month, params.year);
      previousCustomerIdsByMonth.set(
        month,
        new Set(
          priorCustomerRows
            .filter((row) => row.beginningDate < firstDay)
            .map((row) => row.customerId),
        ),
      );
    }

    const rows = Array.from(rowsByKey.values());

    for (const row of rows) {
      for (const { month } of MONTH_REPORT_COLUMNS) {
        const savedKey = `${row.sectorId}:${row.standWidth}:${row.standHeight}:${month}`;
        const savedCount = savedCountsByKey.get(savedKey);

        if (savedCount !== undefined) {
          row.monthlyOccupiedTiles[month] = savedCount;
          continue;
        }

        row.monthlyOccupiedTiles[month] = this.countGeneratedOccupiedTiles({
          distributions:
            distributionsBySectorMonth.get(`${row.sectorId}:${month}`) ?? [],
          previousCustomerIds:
            previousCustomerIdsByMonth.get(month) ?? new Set<string | null>(),
          standWidth: row.standWidth,
          standHeight: row.standHeight,
        });
      }
    }

    return rows.sort(
      (left, right) =>
        left.sectorAcumaticaId.localeCompare(right.sectorAcumaticaId) ||
        left.standWidth - right.standWidth ||
        left.standHeight - right.standHeight,
    );
  }

  private serializePocketsSoldReportCsv(rows: PocketsSoldCsvRow[]) {
    const lines = [
      POCKETS_SOLD_EXPORT_HEADERS.map(escapeCsv).join(','),
      ...rows.map((row) =>
        POCKETS_SOLD_EXPORT_HEADERS.map((header) =>
          escapeCsv(row[header]),
        ).join(','),
      ),
    ];

    return lines.join('\n');
  }

  private async getMatchingSectorLocations(
    sectorId: string,
    standWidth: number,
    standHeight: number,
  ) {
    return db
      .select({
        id: schema.locations.id,
        locationId: schema.locations.locationId,
        name: schema.locations.name,
        address: schema.locations.address,
        pockets: schema.locations.pockets,
      })
      .from(schema.locations)
      .innerJoin(
        schema.locationsSectors,
        eq(schema.locations.id, schema.locationsSectors.locationId),
      )
      .where(
        and(
          eq(schema.locationsSectors.sectorId, sectorId),
          sql`(${schema.locations.pockets}->>'width')::int = ${standWidth}`,
          sql`(${schema.locations.pockets}->>'height')::int = ${standHeight}`,
        ),
      )
      .orderBy(asc(schema.locations.name));
  }

  private async getSectorLayout(
    sectorId: string,
    standWidth: number,
    standHeight: number,
    month: number,
    year: number,
  ) {
    return db.query.chartLayouts.findFirst({
      where: and(
        eq(schema.chartLayouts.sectorId, sectorId),
        eq(schema.chartLayouts.standWidth, standWidth),
        eq(schema.chartLayouts.standHeight, standHeight),
        eq(schema.chartLayouts.month, month),
        eq(schema.chartLayouts.year, year),
      ),
      with: {
        sector: true,
        tiles: {
          with: {
            contract: {
              with: {
                customer: true,
              },
            },
          },
        },
      },
    });
  }

  private async buildContractIdMap(placements: Placement[]) {
    const acumaticaIds = [
      ...new Set(placements.map((placement) => placement.contractId)),
    ].filter(Boolean);

    if (acumaticaIds.length === 0) {
      return new Map<string, string>();
    }

    const contracts = await db.query.contracts.findMany({
      where: inArray(schema.contracts.acumaticaContractId, acumaticaIds),
    });

    return new Map(
      contracts.map((contract) => [contract.acumaticaContractId, contract.id]),
    );
  }

  private async buildPreviewTiles(
    locationId: string,
    sectorId: string,
    month: number,
    year: number,
  ) {
    const fillChart = await getFillChart(locationId, month, year, sectorId);
    const contractIdMap = await this.buildContractIdMap(fillChart.placements);

    return fillChart.placements.map(
      (placement, index): ChartTileResult => ({
        id: `preview-${index}`,
        col: placement.position.col,
        row: placement.position.row,
        colSpan: placement.size.cols,
        tileType: 'Paid',
        warehouseId: null,
        warehouseName: null,
        warehouseAcumaticaId: null,
        brochureTypeId: null,
        brochureTypeName: null,
        brochureId: null,
        brochureName: null,
        inventoryItemId: null,
        contractId: contractIdMap.get(placement.contractId) ?? null,
        label: placement.brochureName,
        coverPhotoUrl: null,
        unitsPerBox: null,
        boxes: null,
        stockLevel: null,
        isNew: placement.isNew,
        isFlagged: false,
        flagNote: null,
        tier: placement.tier,
        contractEndDate: placement.contractEndDate,
        customerName: placement.customerName,
        acumaticaContractId: placement.contractId || null,
      }),
    );
  }

  private safeFilename(value: string) {
    return value.replace(/[^a-zA-Z0-9-_]/g, '_');
  }

  private formatPublicChartTile(tile: ChartTileWithRelations): PublicChartTile {
    return {
      id: tile.id,
      col: tile.col,
      row: tile.row,
      colSpan: tile.colSpan,
      tileType: tile.tileType,
      label: tile.label,
      coverPhotoUrl: tile.coverPhotoUrl,
      brochureTypeName: null,
      contractId: tile.contract?.acumaticaContractId ?? null,
      contractEndDate: tile.contract?.endDate ?? null,
      tier: tile.contract?.tier ?? null,
      isNew: tile.isNew,
      isFlagged: tile.isFlagged,
      flagNote: tile.flagNote,
    };
  }

  private buildPersistedChartForLocation(
    layout: ChartLayoutWithRelations,
    location: {
      id: string;
      name: string;
      address: string;
      pockets: { width: number; height: number };
    },
  ): PublicChartResult {
    return {
      location: {
        id: location.id,
        name: location.name,
        address: location.address,
        pockets: {
          width: layout.standWidth,
          height: layout.standHeight,
        },
      },
      month: layout.month,
      year: layout.year,
      persisted: true,
      generalNotes: layout.generalNotes ?? null,
      tiles: layout.tiles.map((tile) => this.formatPublicChartTile(tile)),
      removals: [],
    };
  }

  private buildGeneratedChartResult(
    fillChart: Awaited<ReturnType<typeof getFillChart>>,
  ): PublicChartResult {
    return {
      location: fillChart.location,
      month: fillChart.month,
      year: fillChart.year,
      persisted: false,
      generalNotes: null,
      tiles: fillChart.placements.map(
        (placement, index): PublicChartTile => ({
          id: `algo-${index}`,
          col: placement.position.col,
          row: placement.position.row,
          colSpan: placement.size.cols,
          tileType: 'Paid',
          label: placement.brochureName,
          coverPhotoUrl: null,
          brochureTypeName: null,
          contractId: placement.contractId || null,
          contractEndDate: placement.contractEndDate,
          tier: placement.tier,
          isNew: placement.isNew,
          isFlagged: false,
          flagNote: null,
        }),
      ),
      removals: fillChart.removals,
    };
  }

  async getSectorChartsPdfData(sectorId: string, params: GetSectorChartParams) {
    const sector = await this.getSectorOrThrow(sectorId);
    const matchingLocations = await this.getMatchingSectorLocations(
      sectorId,
      params.width,
      params.height,
    );

    if (matchingLocations.length === 0) {
      throw new HttpError(
        404,
        'No locations match this sector and stand size',
        'NOT_FOUND',
      );
    }

    const layout = await this.getSectorLayout(
      sectorId,
      params.width,
      params.height,
      params.month,
      params.year,
    );

    const charts = layout
      ? matchingLocations.map((location) =>
          this.buildPersistedChartForLocation(layout, location),
        )
      : await Promise.all(
          matchingLocations.map(async (location) =>
            this.buildGeneratedChartResult(
              await getFillChart(
                location.id,
                params.month,
                params.year,
                sectorId,
              ),
            ),
          ),
        );

    const sectorLabel = sector.acumaticaId;
    const filename = `sector-charts-${this.safeFilename(sectorLabel)}-${params.width}x${params.height}-${params.month}-${params.year}.pdf`;

    return {
      charts,
      sectorLabel,
      title: `CTM Fill Charts - ${sectorLabel} - ${params.width}x${params.height}`,
      filename,
    };
  }

  async exportPocketsSoldReportCSV(params: ExportPocketsSoldReportParams) {
    const rows = await this.getPocketsSoldReportRows(params);
    const csvRows: PocketsSoldCsvRow[] = rows.map((row) => {
      const csvRow: PocketsSoldCsvRow = {
        'Report Year': String(params.year),
        'Sector ID': row.sectorAcumaticaId,
        'Sector Name': row.sectorDescription,
        'Stand Size': `${row.standWidth}x${row.standHeight}`,
        Pockets: String(row.standWidth * row.standHeight),
        Locations: String(row.locationCount),
        Jan: '',
        Feb: '',
        Mar: '',
        Apr: '',
        May: '',
        Jun: '',
        Jul: '',
        Aug: '',
        Sep: '',
        Oct: '',
        Nov: '',
        Dec: '',
      };

      for (const { label, month } of MONTH_REPORT_COLUMNS) {
        csvRow[label] = String(row.monthlyOccupiedTiles[month] ?? 0);
      }

      return csvRow;
    });

    return {
      csv: this.serializePocketsSoldReportCsv(csvRows),
      filename: `chart-pockets-sold-${params.year}.csv`,
    };
  }

  private async buildGeneratedTilesForLayout(
    chartLayoutId: string,
    locationId: string,
    sectorId: string,
    month: number,
    year: number,
  ) {
    const fillChart = await getFillChart(locationId, month, year, sectorId);
    const contractIdMap = await this.buildContractIdMap(fillChart.placements);

    return fillChart.placements.map((placement) => ({
      chartLayoutId,
      col: placement.position.col,
      row: placement.position.row,
      colSpan: placement.size.cols,
      tileType: 'Paid' as const,
      contractId: contractIdMap.get(placement.contractId) ?? null,
      label: placement.brochureName,
      isNew: placement.isNew,
    })) satisfies ChartTileInsert[];
  }

  private async buildSnapshot(
    layout: ChartLayoutWithRelations,
  ): Promise<ArchiveSnapshot> {
    const inventoryById = await this.getInventoryDetailsByIds(
      this.getInventoryItemIds(layout.tiles),
    );
    const chart = this.buildChartLayoutResult(layout, {
      inventoryById,
      availableInventory: [],
      paidTiles: [],
    });
    const totalPaid = chart.tiles.filter(
      (tile) => tile.tileType === 'Paid',
    ).length;
    const totalFillers = chart.tiles.filter(
      (tile) => tile.tileType === 'Filler',
    ).length;
    const usedCells = chart.tiles.reduce((sum, tile) => sum + tile.colSpan, 0);
    const totalCells = chart.standWidth * chart.standHeight;

    return {
      layout: {
        id: chart.id,
        sectorId: chart.sectorId,
        sectorDescription: chart.sectorDescription,
        sectorAcumaticaId: chart.sectorAcumaticaId,
        standWidth: chart.standWidth,
        standHeight: chart.standHeight,
        displayName: chart.displayName,
        displayDescription: chart.displayDescription,
        month: chart.month,
        year: chart.year,
        status: chart.status,
        locked: chart.locked,
        generalNotes: chart.generalNotes,
        gridSize: chart.gridSize,
        completedAt: chart.completedAt,
        completedBy: chart.completedBy,
        archivedAt: chart.archivedAt,
        archivedBy: chart.archivedBy,
        createdAt: chart.createdAt,
        updatedAt: chart.updatedAt,
      },
      tiles: chart.tiles,
      metadata: {
        displayName: chart.displayName,
        sectorDescription: chart.sectorDescription,
        sectorAcumaticaId: chart.sectorAcumaticaId,
        standWidth: chart.standWidth,
        standHeight: chart.standHeight,
        gridSize: chart.gridSize,
        totalPaid,
        totalFillers,
        totalEmpty: Math.max(totalCells - usedCells, 0),
        archivedAt: chart.archivedAt,
      },
    };
  }

  async list(params: ListChartsParams): Promise<ListChartsResult> {
    const whereClause = this.buildSearchWhere(params.search);

    const [countResult, sectorRows] = await Promise.all([
      db
        .select({
          total: sql<number>`COUNT(DISTINCT ${schema.sectors.id})`.mapWith(
            Number,
          ),
        })
        .from(schema.sectors)
        .innerJoin(
          schema.locationsSectors,
          eq(schema.locationsSectors.sectorId, schema.sectors.id),
        )
        .innerJoin(
          schema.locations,
          eq(schema.locations.id, schema.locationsSectors.locationId),
        )
        .where(whereClause),
      db
        .select({
          id: schema.sectors.id,
          acumaticaId: schema.sectors.acumaticaId,
          description: schema.sectors.description,
        })
        .from(schema.sectors)
        .innerJoin(
          schema.locationsSectors,
          eq(schema.locationsSectors.sectorId, schema.sectors.id),
        )
        .innerJoin(
          schema.locations,
          eq(schema.locations.id, schema.locationsSectors.locationId),
        )
        .where(whereClause)
        .groupBy(
          schema.sectors.id,
          schema.sectors.acumaticaId,
          schema.sectors.description,
        )
        .orderBy(asc(schema.sectors.acumaticaId))
        .limit(params.limit)
        .offset(getPaginationOffset(params)),
    ]);

    const total = countResult[0]?.total ?? 0;

    if (sectorRows.length === 0) {
      return createPaginatedResult({
        data: [],
        page: params.page,
        limit: params.limit,
        total,
      });
    }

    const sectorIds = sectorRows.map((sector) => sector.id);
    const standWidth = sql<number>`(${schema.locations.pockets}->>'width')::int`;
    const standHeight = sql<number>`(${schema.locations.pockets}->>'height')::int`;

    const locationRows: LocationRow[] = await db
      .select({
        sectorId: schema.locationsSectors.sectorId,
        locationInternalId: schema.locations.id,
        locationId: schema.locations.locationId,
        name: schema.locations.name,
        address: schema.locations.address,
        city: schema.locations.city,
        state: schema.locations.state,
        zip: schema.locations.zip,
        pockets: schema.locations.pockets,
        width: standWidth.mapWith(Number),
        height: standHeight.mapWith(Number),
        chartLayoutId: schema.chartLayouts.id,
        chartStatus: schema.chartLayouts.status,
        locked: schema.chartLayouts.locked,
      })
      .from(schema.locationsSectors)
      .innerJoin(
        schema.locations,
        eq(schema.locations.id, schema.locationsSectors.locationId),
      )
      .leftJoin(
        schema.chartLayouts,
        and(
          eq(schema.chartLayouts.sectorId, schema.locationsSectors.sectorId),
          sql`${schema.chartLayouts.standWidth} = (${schema.locations.pockets}->>'width')::int`,
          sql`${schema.chartLayouts.standHeight} = (${schema.locations.pockets}->>'height')::int`,
          eq(schema.chartLayouts.month, params.month),
          eq(schema.chartLayouts.year, params.year),
        ),
      )
      .where(inArray(schema.locationsSectors.sectorId, sectorIds))
      .orderBy(
        schema.locationsSectors.sectorId,
        standWidth,
        standHeight,
        asc(schema.locations.name),
      );

    const sectorsById = new Map<string, SectorChartsResult>();
    const standSizeMapsBySectorId = new Map<
      string,
      Map<string, SectorStandSizeResult>
    >();

    for (const sector of sectorRows) {
      sectorsById.set(sector.id, {
        id: sector.id,
        acumaticaId: sector.acumaticaId,
        description: sector.description,
        matchesSearch: this.sectorMatchesSearch(sector, params.search),
        standSizes: [],
      });
      standSizeMapsBySectorId.set(sector.id, new Map());
    }

    for (const location of locationRows) {
      const sector = sectorsById.get(location.sectorId);
      const standSizeMap = standSizeMapsBySectorId.get(location.sectorId);
      if (!sector || !standSizeMap) continue;

      const key = `${location.width}:${location.height}`;
      let standSize = standSizeMap.get(key);

      if (!standSize) {
        standSize = {
          width: location.width,
          height: location.height,
          locationCount: 0,
          matchedLocationCount: 0,
          chartLayoutId: location.chartLayoutId,
          chartStatus: location.chartStatus,
          locked: location.locked ?? false,
          locations: [],
        };
        standSizeMap.set(key, standSize);
        sector.standSizes.push(standSize);
      }

      const locationMatches = this.locationMatchesSearch(
        location,
        params.search,
      );
      standSize.locationCount += 1;
      if (locationMatches) {
        standSize.matchedLocationCount += 1;
      }

      if (!params.search || sector.matchesSearch || locationMatches) {
        standSize.locations.push(
          this.formatLocation(location, locationMatches),
        );
      }
    }

    return createPaginatedResult({
      data: sectorRows.map((sector) => sectorsById.get(sector.id)!),
      page: params.page,
      limit: params.limit,
      total,
    });
  }

  async getById(id: string) {
    const layout = await this.getLayoutById(id);
    const locationCount = await this.getLocationCount(
      layout.sectorId,
      layout.standWidth,
      layout.standHeight,
    );

    return this.formatResponse(layout, { locationCount });
  }

  async getSectorChart(sectorId: string, params: GetSectorChartParams) {
    const sector = await this.getSectorOrThrow(sectorId);
    const matchingLocations = await this.getMatchingSectorLocations(
      sectorId,
      params.width,
      params.height,
    );

    if (matchingLocations.length === 0) {
      throw new HttpError(
        404,
        'No locations match this sector and stand size',
        'NOT_FOUND',
      );
    }

    const primaryLocation = matchingLocations[0]!;

    const existing = await this.getSectorLayout(
      sectorId,
      params.width,
      params.height,
      params.month,
      params.year,
    );

    if (existing) {
      return this.formatResponse(existing, {
        locationCount: matchingLocations.length,
      });
    }

    const tiles = await this.buildPreviewTiles(
      primaryLocation.id,
      sectorId,
      params.month,
      params.year,
    );
    const availableInventory = await this.getSectorInventoryItems(sectorId);

    return {
      id: null,
      sectorId,
      sectorDescription: sector.description,
      sectorAcumaticaId: sector.acumaticaId,
      standWidth: params.width,
      standHeight: params.height,
      displayName: `${sector.acumaticaId} - ${params.width}x${params.height}`,
      displayDescription: sector.description,
      month: params.month,
      year: params.year,
      status: 'Draft' as const,
      locked: false,
      generalNotes: null,
      gridSize: { width: params.width, height: params.height },
      completedAt: null,
      completedBy: null,
      archivedAt: null,
      archivedBy: null,
      createdAt: null,
      updatedAt: null,
      persisted: false,
      locationCount: matchingLocations.length,
      availableInventory,
      paidTiles: tiles,
      tiles,
    };
  }

  async initializeSectorChart(
    sectorId: string,
    values: InitializeSectorChartInput,
  ) {
    this.ensureNotPastMonth(values);
    await this.getSectorOrThrow(sectorId);

    const matchingLocations = await this.getMatchingSectorLocations(
      sectorId,
      values.width,
      values.height,
    );

    if (matchingLocations.length === 0) {
      throw new HttpError(
        404,
        'No locations match this sector and stand size',
        'NOT_FOUND',
      );
    }

    const primaryLocation = matchingLocations[0]!;

    const existing = await this.getSectorLayout(
      sectorId,
      values.width,
      values.height,
      values.month,
      values.year,
    );

    if (existing) {
      return this.formatResponse(existing, {
        locationCount: matchingLocations.length,
      });
    }

    const layout = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(schema.chartLayouts)
        .values({
          sectorId,
          standWidth: values.width,
          standHeight: values.height,
          month: values.month,
          year: values.year,
          status: 'Draft',
        })
        .returning();

      if (!created) {
        throw new HttpError(500, 'Failed to create chart', 'INTERNAL_SERVER');
      }

      const tilesToInsert = await this.buildGeneratedTilesForLayout(
        created.id,
        primaryLocation.id,
        sectorId,
        values.month,
        values.year,
      );

      if (tilesToInsert.length > 0) {
        await tx.insert(schema.chartTiles).values(tilesToInsert);
      }

      return created;
    });

    const fullLayout = await this.getLayoutById(layout.id);
    return this.formatResponse(fullLayout, {
      locationCount: matchingLocations.length,
    });
  }

  async save(id: string, values: SaveChartInput) {
    const layout = await this.getLayoutById(id);
    this.ensureEditable(layout);
    this.validateTilePlacements(layout, values.tiles);
    await this.assertTileReferencesExist(values.tiles, layout.sectorId);

    await db.transaction(async (tx) => {
      await tx
        .delete(schema.chartTiles)
        .where(eq(schema.chartTiles.chartLayoutId, layout.id));

      if (values.tiles.length > 0) {
        await tx
          .insert(schema.chartTiles)
          .values(
            values.tiles.map((tile) => this.normalizeTileInput(id, tile)),
          );
      }

      await tx
        .update(schema.chartLayouts)
        .set({
          ...(values.generalNotes !== undefined && {
            generalNotes: values.generalNotes,
          }),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.chartLayouts.id, id));
    });

    return this.getById(id);
  }

  async upsertTile(chartId: string, tile: TileInput) {
    const layout = await this.getLayoutById(chartId);
    this.ensureEditable(layout);

    const otherTiles = layout.tiles
      .filter((existing) => existing.id !== tile.id)
      .map((existing) => ({
        id: existing.id,
        col: existing.col,
        row: existing.row,
        colSpan: existing.colSpan,
      }));

    this.validateTilePlacements(layout, [...otherTiles, tile]);
    await this.assertTileReferencesExist([tile], layout.sectorId);

    const tileValues = this.normalizeTileInput(chartId, tile);

    if (tile.id) {
      const existing = await db.query.chartTiles.findFirst({
        where: and(
          eq(schema.chartTiles.id, tile.id),
          eq(schema.chartTiles.chartLayoutId, chartId),
        ),
      });

      if (!existing) {
        throw new HttpError(404, 'Tile not found in this chart', 'NOT_FOUND');
      }

      const [updated] = await db
        .update(schema.chartTiles)
        .set({ ...tileValues, updatedAt: new Date().toISOString() })
        .where(eq(schema.chartTiles.id, tile.id))
        .returning();

      await db
        .update(schema.chartLayouts)
        .set({ updatedAt: new Date().toISOString() })
        .where(eq(schema.chartLayouts.id, chartId));

      return updated;
    }

    const [inserted] = await db
      .insert(schema.chartTiles)
      .values(tileValues)
      .returning();

    await db
      .update(schema.chartLayouts)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(schema.chartLayouts.id, chartId));

    return inserted;
  }

  async removeTile(chartId: string, tileId: string) {
    const layout = await this.getLayoutById(chartId);
    this.ensureEditable(layout);

    const tile = await db.query.chartTiles.findFirst({
      where: and(
        eq(schema.chartTiles.id, tileId),
        eq(schema.chartTiles.chartLayoutId, chartId),
      ),
    });

    if (!tile) {
      throw new HttpError(404, 'Tile not found in this chart', 'NOT_FOUND');
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(schema.chartTiles)
        .where(eq(schema.chartTiles.id, tileId));
      await tx
        .update(schema.chartLayouts)
        .set({ updatedAt: new Date().toISOString() })
        .where(eq(schema.chartLayouts.id, chartId));
    });

    return { deleted: true };
  }

  async complete(chartId: string, userId: string) {
    const layout = await this.getLayoutById(chartId);
    this.ensureNotPastMonth(layout);

    if (layout.locked) {
      throw new HttpError(400, 'Chart is already locked', 'BAD_REQUEST');
    }

    if (layout.status !== 'Draft') {
      throw new HttpError(
        400,
        'Only Draft charts can be completed',
        'BAD_REQUEST',
      );
    }

    await db
      .update(schema.chartLayouts)
      .set({
        status: 'Completed',
        locked: true,
        completedAt: new Date().toISOString(),
        completedBy: userId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.chartLayouts.id, chartId));

    return this.getById(chartId);
  }

  async clone(chartId: string, options?: CloneChartInput) {
    const source = await this.getLayoutById(chartId);
    const { nextMonth, nextYear } = this.getNextMonthYear(
      source.month,
      source.year,
    );

    this.ensureNotPastMonth({ month: nextMonth, year: nextYear });

    const existing = await this.getSectorLayout(
      source.sectorId,
      source.standWidth,
      source.standHeight,
      nextMonth,
      nextYear,
    );

    if (existing && !options?.force) {
      throw new HttpError(
        409,
        `A chart already exists for ${nextMonth}/${nextYear}`,
        'CONFLICT',
      );
    }

    if (existing?.locked || existing?.status === 'Archived') {
      throw new HttpError(
        409,
        'Cannot overwrite a locked or archived chart',
        'CONFLICT',
      );
    }

    const now = new Date().toISOString();
    const result = await db.transaction(async (tx) => {
      const target = existing
        ? existing
        : (
            await tx
              .insert(schema.chartLayouts)
              .values({
                sectorId: source.sectorId,
                standWidth: source.standWidth,
                standHeight: source.standHeight,
                month: nextMonth,
                year: nextYear,
                status: 'Draft',
                generalNotes: source.generalNotes,
              })
              .returning()
          )[0];

      if (!target) {
        throw new HttpError(500, 'Failed to clone chart', 'INTERNAL_SERVER');
      }

      await tx
        .delete(schema.chartTiles)
        .where(eq(schema.chartTiles.chartLayoutId, target.id));

      const targetTiles = source.tiles.map((tile) =>
        this.copyTileToLayout(target.id, tile),
      );

      if (targetTiles.length > 0) {
        await tx.insert(schema.chartTiles).values(targetTiles);
      }

      await tx
        .update(schema.chartLayouts)
        .set({
          status: 'Draft',
          locked: false,
          generalNotes: source.generalNotes,
          completedAt: null,
          completedBy: null,
          archivedAt: null,
          archivedBy: null,
          updatedAt: now,
        })
        .where(eq(schema.chartLayouts.id, target.id));

      return target;
    });

    return this.getById(result.id);
  }

  async archive(chartId: string, userId: string) {
    const layout = await this.getLayoutById(chartId);

    if (layout.status === 'Archived') {
      throw new HttpError(409, 'Chart is already archived', 'CONFLICT');
    }

    await db
      .update(schema.chartLayouts)
      .set({
        status: 'Archived',
        locked: true,
        archivedAt: new Date().toISOString(),
        archivedBy: userId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.chartLayouts.id, chartId));

    return this.getById(chartId);
  }

  async listArchives(params: ListArchivesParams) {
    const conditions: SQL[] = [eq(schema.chartLayouts.status, 'Archived')];

    if (params.month)
      conditions.push(eq(schema.chartLayouts.month, params.month));
    if (params.year) conditions.push(eq(schema.chartLayouts.year, params.year));
    if (params.sectorId)
      conditions.push(eq(schema.chartLayouts.sectorId, params.sectorId));
    if (params.search) {
      const term = `%${this.escapeLike(params.search)}%`;
      conditions.push(
        or(
          ilike(schema.sectors.acumaticaId, term),
          ilike(schema.sectors.description, term),
        )!,
      );
    }

    const whereClause = and(...conditions);

    const [countResult, rows] = await Promise.all([
      db
        .select({ total: count() })
        .from(schema.chartLayouts)
        .innerJoin(
          schema.sectors,
          eq(schema.chartLayouts.sectorId, schema.sectors.id),
        )
        .where(whereClause),
      db
        .select({
          id: schema.chartLayouts.id,
          sectorId: schema.chartLayouts.sectorId,
          sectorDescription: schema.sectors.description,
          sectorAcumaticaId: schema.sectors.acumaticaId,
          standWidth: schema.chartLayouts.standWidth,
          standHeight: schema.chartLayouts.standHeight,
          month: schema.chartLayouts.month,
          year: schema.chartLayouts.year,
          archivedAt: schema.chartLayouts.archivedAt,
        })
        .from(schema.chartLayouts)
        .innerJoin(
          schema.sectors,
          eq(schema.chartLayouts.sectorId, schema.sectors.id),
        )
        .where(whereClause)
        .orderBy(
          desc(schema.chartLayouts.archivedAt),
          desc(schema.chartLayouts.updatedAt),
        )
        .limit(params.limit)
        .offset(getPaginationOffset(params)),
    ]);

    const layoutIds = rows.map((row) => row.id);
    const countRows =
      layoutIds.length > 0
        ? await db
            .select({
              chartLayoutId: schema.chartTiles.chartLayoutId,
              totalPaid:
                sql<number>`COUNT(*) FILTER (WHERE ${schema.chartTiles.tileType} = 'Paid')`.mapWith(
                  Number,
                ),
              totalFillers:
                sql<number>`COUNT(*) FILTER (WHERE ${schema.chartTiles.tileType} = 'Filler')`.mapWith(
                  Number,
                ),
            })
            .from(schema.chartTiles)
            .where(inArray(schema.chartTiles.chartLayoutId, layoutIds))
            .groupBy(schema.chartTiles.chartLayoutId)
        : [];

    const countsByLayoutId = new Map(
      countRows.map((row) => [
        row.chartLayoutId,
        { totalPaid: row.totalPaid, totalFillers: row.totalFillers },
      ]),
    );

    const data: ArchiveListItem[] = rows.map((row) => {
      const tileCounts = countsByLayoutId.get(row.id) ?? {
        totalPaid: 0,
        totalFillers: 0,
      };

      return {
        id: row.id,
        chartLayoutId: row.id,
        displayName: `${row.sectorAcumaticaId} - ${row.standWidth}x${row.standHeight}`,
        sectorDescription: row.sectorDescription,
        sectorAcumaticaId: row.sectorAcumaticaId,
        standWidth: row.standWidth,
        standHeight: row.standHeight,
        month: row.month,
        year: row.year,
        totalPaid: tileCounts.totalPaid,
        totalFillers: tileCounts.totalFillers,
        archivedAt: row.archivedAt,
      };
    });

    return createPaginatedResult({
      data,
      page: params.page,
      limit: params.limit,
      total: countResult[0]?.total ?? 0,
    });
  }

  async getArchive(id: string): Promise<ArchiveDetail> {
    const layout = await this.getLayoutById(id);

    if (layout.status !== 'Archived') {
      throw new HttpError(404, 'Chart archive not found', 'NOT_FOUND');
    }

    return {
      id: layout.id,
      chartLayoutId: layout.id,
      archivedAt: layout.archivedAt,
      snapshot: await this.buildSnapshot(layout),
    };
  }
}

export const chartsService = new ChartsService();
