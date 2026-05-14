import db from '@/db';

import { and, eq, inArray, or } from 'drizzle-orm';

import HttpError from '@repo/server-utils/errors/http-error';

import * as schema from '@services/database/schemas';

import { getFillChart } from '@/utils/fill-chart';

import type { ChartResult, ChartTile } from './charts.types';

type ChartRemoval = ChartResult['removals'][number];

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class ChartsService {
  async getChart(
    locationId: string,
    month: number,
    year: number,
  ): Promise<ChartResult> {
    const location = await this.resolveLocation(locationId);
    const pockets = location.pockets as { width: number; height: number };
    const sectorId = await this.resolveSingleSectorId(location.id);

    const layout = sectorId
      ? await this.findSectorLayout(sectorId, pockets, month, year)
      : null;

    if (layout) {
      const tiles = this.formatLayoutTiles(layout);
      const removals = await this.buildPreviousMonthRemovals({
        locationId: location.id,
        sectorId: layout.sectorId,
        pockets,
        month,
        year,
        currentTiles: tiles,
      });

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
        month,
        year,
        persisted: true,
        generalNotes: layout.generalNotes ?? null,
        tiles,
        removals,
      };
    }

    const fillChart = await getFillChart(locationId, month, year);

    const tiles = this.formatGeneratedTiles(fillChart.placements);
    const removals = sectorId
      ? await this.buildPreviousMonthRemovals({
          locationId: location.id,
          sectorId,
          pockets,
          month,
          year,
          currentTiles: tiles,
        })
      : fillChart.removals;

    return {
      location: {
        id: fillChart.location.id,
        name: fillChart.location.name,
        address: fillChart.location.address,
        pockets: fillChart.location.pockets,
      },
      month,
      year,
      persisted: false,
      generalNotes: null,
      tiles,
      removals,
    };
  }

  private formatLayoutTiles(
    layout: NonNullable<Awaited<ReturnType<ChartsService['findSectorLayout']>>>,
  ) {
    return layout.tiles.map(
      (tile): ChartTile => ({
        id: tile.id,
        col: tile.col,
        row: tile.row,
        colSpan: tile.colSpan,
        tileType: tile.tileType,
        label: tile.label ?? tile.customFiller?.name ?? null,
        coverPhotoUrl: tile.coverPhotoUrl,
        brochureTypeName: null,
        customFillerId: tile.customFillerId,
        contractId: tile.contract?.acumaticaContractId ?? null,
        contractEndDate: tile.contract?.endDate ?? null,
        tier: tile.contract?.tier ?? null,
        customerName: tile.contract?.customer?.name ?? null,
        isNew: tile.isNew,
        isFlagged: tile.isFlagged,
        flagNote: tile.flagNote,
      }),
    );
  }

  private formatGeneratedTiles(
    placements: Awaited<ReturnType<typeof getFillChart>>['placements'],
  ) {
    return placements.map(
      (placement, index): ChartTile => ({
        id: `algo-${index}`,
        col: placement.position.col,
        row: placement.position.row,
        colSpan: placement.size.cols,
        tileType: 'Paid',
        label: placement.brochureName,
        coverPhotoUrl: null,
        brochureTypeName: null,
        customFillerId: null,
        contractId: placement.contractId || null,
        contractEndDate: placement.contractEndDate,
        tier: placement.tier,
        customerName: placement.customerName,
        isNew: placement.isNew,
        isFlagged: false,
        flagNote: null,
      }),
    );
  }

  private getMonthDateRange(month: number, year: number) {
    const monthValue = String(month).padStart(2, '0');

    return { firstDay: `${year}-${monthValue}-01` };
  }

  private getPreviousMonthYear(month: number, year: number) {
    if (month === 1) {
      return { previousMonth: 12, previousYear: year - 1 };
    }

    return { previousMonth: month - 1, previousYear: year };
  }

  private getPaidRemovalIdentityKey(tile: ChartTile) {
    return [
      tile.label?.trim().toLowerCase() ?? '',
      tile.customerName?.trim().toLowerCase() ?? '',
      tile.colSpan,
    ].join('|');
  }

  private isPaidTileActiveOnOrAfter(tile: ChartTile, firstDay: string) {
    if (tile.tileType !== 'Paid') return false;
    return !tile.contractEndDate || tile.contractEndDate >= firstDay;
  }

  private async getComparisonTilesForMonth(params: {
    locationId: string;
    sectorId: string;
    pockets: { width: number; height: number };
    month: number;
    year: number;
  }) {
    const layout = await this.findSectorLayout(
      params.sectorId,
      params.pockets,
      params.month,
      params.year,
    );

    if (layout) return this.formatLayoutTiles(layout);

    const fillChart = await getFillChart(
      params.locationId,
      params.month,
      params.year,
      params.sectorId,
    );

    return this.formatGeneratedTiles(fillChart.placements);
  }

  private async buildPreviousMonthRemovals(params: {
    locationId: string;
    sectorId: string;
    pockets: { width: number; height: number };
    month: number;
    year: number;
    currentTiles: ChartTile[];
  }): Promise<ChartRemoval[]> {
    const { firstDay } = this.getMonthDateRange(params.month, params.year);
    const { previousMonth, previousYear } = this.getPreviousMonthYear(
      params.month,
      params.year,
    );
    const previousTiles = await this.getComparisonTilesForMonth({
      locationId: params.locationId,
      sectorId: params.sectorId,
      pockets: params.pockets,
      month: previousMonth,
      year: previousYear,
    });
    const activeCurrentKeys = new Set(
      params.currentTiles
        .filter((tile) => this.isPaidTileActiveOnOrAfter(tile, firstDay))
        .map((tile) => this.getPaidRemovalIdentityKey(tile)),
    );

    return previousTiles
      .filter(
        (tile) =>
          tile.tileType === 'Paid' &&
          Boolean(tile.contractEndDate) &&
          tile.contractEndDate! < firstDay &&
          !activeCurrentKeys.has(this.getPaidRemovalIdentityKey(tile)),
      )
      .map((tile) => ({
        brochureName: tile.label ?? 'Paid contract',
        customerName: tile.customerName,
        type: tile.colSpan > 1 ? ('MAG' as const) : ('BROCH' as const),
        expiredDate: tile.contractEndDate!,
        size: { cols: tile.colSpan, rows: 1 },
        position: { col: tile.col, row: tile.row },
        contractId: tile.contractId ?? '',
      }))
      .sort(
        (left, right) =>
          left.position.row - right.position.row ||
          left.position.col - right.position.col ||
          left.brochureName.localeCompare(right.brochureName),
      );
  }

  async getSectorLabel(locationDbId: string): Promise<string> {
    const sectorRows = await db
      .select({ sectorId: schema.locationsSectors.sectorId })
      .from(schema.locationsSectors)
      .where(eq(schema.locationsSectors.locationId, locationDbId));

    const sectorIds = sectorRows.map((r) => r.sectorId);
    if (sectorIds.length === 0) return '';

    const sectorDetails = await db
      .select({ acumaticaId: schema.sectors.acumaticaId })
      .from(schema.sectors)
      .where(inArray(schema.sectors.id, sectorIds));

    return sectorDetails.map((s) => s.acumaticaId).join(', ');
  }

  private async findSectorLayout(
    sectorId: string,
    pockets: { width: number; height: number },
    month: number,
    year: number,
  ) {
    const baseFilter = and(
      eq(schema.chartLayouts.sectorId, sectorId),
      eq(schema.chartLayouts.month, month),
      eq(schema.chartLayouts.year, year),
    );

    return db.query.chartLayouts.findFirst({
      where: and(
        baseFilter,
        eq(schema.chartLayouts.standWidth, pockets.width),
        eq(schema.chartLayouts.standHeight, pockets.height),
      ),
      with: {
        tiles: {
          with: {
            contract: {
              with: {
                customer: true,
              },
            },
            customFiller: true,
          },
        },
      },
    });
  }

  private async resolveLocation(locationId: string) {
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

    return location;
  }

  private async resolveSingleSectorId(locationDbId: string) {
    const sectorRows = await db
      .select({ sectorId: schema.locationsSectors.sectorId })
      .from(schema.locationsSectors)
      .where(eq(schema.locationsSectors.locationId, locationDbId));

    if (sectorRows.length > 1) {
      throw new HttpError(
        409,
        'Location is assigned to multiple sectors; public chart resolution requires exactly one sector',
        'CONFLICT',
      );
    }

    return sectorRows[0]?.sectorId ?? null;
  }
}

export const chartsService = new ChartsService();
