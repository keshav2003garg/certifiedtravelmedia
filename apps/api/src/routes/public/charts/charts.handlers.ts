import sendResponse from '@repo/server-utils/utils/response';

import { generateChartPDF } from '@/utils/pdf/chart-pdf';

import { chartsService } from './charts.services';

import type { GetChartContext } from './charts.validators';

export async function getChartHandler(ctx: GetChartContext) {
  const { locationId } = ctx.req.valid('param');
  const { month, year } = ctx.req.valid('query');

  const chart = await chartsService.getChart(locationId, month, year);

  return sendResponse(ctx, 200, 'Chart retrieved successfully', {
    location: chart.location,
    month: chart.month,
    year: chart.year,
    persisted: chart.persisted,
    generalNotes: chart.generalNotes,
    tiles: chart.tiles,
    removals: chart.removals,
  });
}

export async function getChartPDFHandler(ctx: GetChartContext) {
  const { locationId } = ctx.req.valid('param');
  const { month, year } = ctx.req.valid('query');

  const chart = await chartsService.getChart(locationId, month, year);
  const sectorLabel = await chartsService.getSectorLabel(chart.location.id);

  const { buffer, filename } = await generateChartPDF({ chart, sectorLabel });

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  });
}
