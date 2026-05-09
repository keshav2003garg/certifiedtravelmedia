import db from '@/db';

import { and, eq, inArray, or } from 'drizzle-orm';

import HttpError from '@repo/server-utils/errors/http-error';

import * as schema from '@services/database/schemas';

import { getFillChart } from '@/utils/fill-chart';

import type { ChartResult, ChartTile } from './charts.types';

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
      const tiles: ChartTile[] = layout.tiles.map((tile) => ({
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
        customerName: null,
        isNew: tile.isNew,
        isFlagged: tile.isFlagged,
        flagNote: tile.flagNote,
      }));

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
        removals: [],
      };
    }

    const fillChart = await getFillChart(locationId, month, year);

    const tiles: ChartTile[] = fillChart.placements.map((p, i) => ({
      id: `algo-${i}`,
      col: p.position.col,
      row: p.position.row,
      colSpan: p.size.cols,
      tileType: 'Paid' as const,
      label: p.brochureName,
      coverPhotoUrl: null,
      brochureTypeName: null,
      customFillerId: null,
      contractId: p.contractId || null,
      contractEndDate: p.contractEndDate,
      tier: p.tier,
      customerName: p.customerName,
      isNew: p.isNew,
      isFlagged: false,
      flagNote: null,
    }));

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
      removals: fillChart.removals,
    };
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
            contract: true,
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
