import sendResponse from '@repo/server-utils/utils/response';

import { generateChartsPDF } from '@/utils/pdf/chart-pdf';

import { chartsService } from './charts.services';

import type {
  ChartIdContext,
  CloneChartContext,
  CreateCustomFillerContext,
  DeleteTileContext,
  ExportPocketsSoldReportContext,
  GetArchiveContext,
  GetSectorChartContext,
  InitializeSectorChartContext,
  ListArchivesContext,
  ListChartsContext,
  ListCustomFillersContext,
  ListSectorInventoryContext,
  SaveChartContext,
  UpsertTileContext,
} from './charts.validators';

export async function listChartsHandler(ctx: ListChartsContext) {
  const params = ctx.req.valid('query');

  const result = await chartsService.list(params);

  return sendResponse(ctx, 200, 'Charts retrieved successfully', {
    sectors: result.data,
    pagination: result.pagination,
  });
}

export async function getSectorChartHandler(ctx: GetSectorChartContext) {
  const { sectorId } = ctx.req.valid('param');
  const params = ctx.req.valid('query');

  const chart = await chartsService.getSectorChart(sectorId, params);

  return sendResponse(ctx, 200, 'Chart retrieved successfully', { chart });
}

export async function getSectorChartsPdfHandler(ctx: GetSectorChartContext) {
  const { sectorId } = ctx.req.valid('param');
  const params = ctx.req.valid('query');

  const pdfData = await chartsService.getSectorChartsPdfData(sectorId, params);
  const { buffer, filename } = await generateChartsPDF(pdfData);

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  });
}

export async function exportPocketsSoldReportHandler(
  ctx: ExportPocketsSoldReportContext,
) {
  const params = ctx.req.valid('query');
  const { csv, filename } =
    await chartsService.exportPocketsSoldReportCSV(params);

  ctx.header('Content-Type', 'text/csv; charset=utf-8');
  ctx.header('Content-Disposition', `attachment; filename="${filename}"`);

  return ctx.body(csv);
}

export async function initializeSectorChartHandler(
  ctx: InitializeSectorChartContext,
) {
  const { sectorId } = ctx.req.valid('param');
  const body = ctx.req.valid('json');

  const chart = await chartsService.initializeSectorChart(sectorId, body);

  return sendResponse(ctx, 201, 'Chart initialized successfully', { chart });
}

export async function listCustomFillersHandler(ctx: ListCustomFillersContext) {
  const params = ctx.req.valid('query');

  const result = await chartsService.listCustomFillers(params);

  return sendResponse(ctx, 200, 'Custom fillers retrieved successfully', {
    customFillers: result.data,
    pagination: result.pagination,
  });
}

export async function listSectorInventoryHandler(
  ctx: ListSectorInventoryContext,
) {
  const { sectorId } = ctx.req.valid('param');
  const params = ctx.req.valid('query');

  const result = await chartsService.listSectorInventory(sectorId, params);

  return sendResponse(ctx, 200, 'Available inventory retrieved successfully', {
    inventory: result.data,
    pagination: result.pagination,
  });
}

export async function createCustomFillerHandler(
  ctx: CreateCustomFillerContext,
) {
  const body = ctx.req.valid('json');
  const user = ctx.get('user')!;

  const result = await chartsService.createCustomFiller(body, user.id);

  return sendResponse(ctx, 201, 'Custom filler created successfully', result);
}

export async function getChartHandler(ctx: ChartIdContext) {
  const { id } = ctx.req.valid('param');

  const chart = await chartsService.getById(id);

  return sendResponse(ctx, 200, 'Chart retrieved successfully', { chart });
}

export async function saveChartHandler(ctx: SaveChartContext) {
  const { id } = ctx.req.valid('param');
  const body = ctx.req.valid('json');

  const chart = await chartsService.save(id, body);

  return sendResponse(ctx, 200, 'Chart saved successfully', { chart });
}

export async function upsertTileHandler(ctx: UpsertTileContext) {
  const { id } = ctx.req.valid('param');
  const body = ctx.req.valid('json');

  const tile = await chartsService.upsertTile(id, body);

  return sendResponse(ctx, 200, 'Tile saved successfully', { tile });
}

export async function deleteTileHandler(ctx: DeleteTileContext) {
  const { id, tileId } = ctx.req.valid('param');

  const result = await chartsService.removeTile(id, tileId);

  return sendResponse(ctx, 200, 'Tile removed successfully', result);
}

export async function completeChartHandler(ctx: ChartIdContext) {
  const { id } = ctx.req.valid('param');
  const user = ctx.get('user')!;

  const chart = await chartsService.complete(id, user.id);

  return sendResponse(ctx, 200, 'Chart completed successfully', { chart });
}

export async function cloneChartHandler(ctx: CloneChartContext) {
  const { id } = ctx.req.valid('param');
  const body = ctx.req.valid('json');

  const chart = await chartsService.clone(id, body);

  return sendResponse(ctx, 201, 'Chart cloned successfully', { chart });
}

export async function archiveChartHandler(ctx: ChartIdContext) {
  const { id } = ctx.req.valid('param');
  const user = ctx.get('user')!;

  const chart = await chartsService.archive(id, user.id);

  return sendResponse(ctx, 200, 'Chart archived successfully', { chart });
}

export async function listArchivesHandler(ctx: ListArchivesContext) {
  const params = ctx.req.valid('query');

  const result = await chartsService.listArchives(params);

  return sendResponse(ctx, 200, 'Chart archives retrieved successfully', {
    archives: result.data,
    pagination: result.pagination,
  });
}

export async function getArchiveHandler(ctx: GetArchiveContext) {
  const { id } = ctx.req.valid('param');

  const archive = await chartsService.getArchive(id);

  return sendResponse(ctx, 200, 'Chart archive retrieved successfully', {
    archive,
  });
}
