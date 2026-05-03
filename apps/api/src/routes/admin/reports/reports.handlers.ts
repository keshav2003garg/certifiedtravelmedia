import { generateCustomerYearlyReportPDF } from '@/utils/pdf/customer-yearly-report-pdf';
import { generateInventoryMonthlyReportPDF } from '@/utils/pdf/inventory-monthly-report-pdf';

import { reportsService } from './reports.services';

import type {
  CustomerYearlyReportContext,
  InventoryMonthlyReportContext,
} from './reports.validators';

export async function downloadInventoryMonthlyReportPdfHandler(
  ctx: InventoryMonthlyReportContext,
) {
  const params = ctx.req.valid('query');
  const report = await reportsService.getInventoryMonthlyReport(params);
  const { buffer, filename } = await generateInventoryMonthlyReportPDF(report);

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  });
}

export async function downloadCustomerYearlyReportPdfHandler(
  ctx: CustomerYearlyReportContext,
) {
  const params = ctx.req.valid('query');
  const report = await reportsService.getCustomerYearlyReport(params);
  const { buffer, filename } = await generateCustomerYearlyReportPDF(report);

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  });
}
