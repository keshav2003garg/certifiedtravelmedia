import sendResponse from '@repo/server-utils/utils/response';

import {
  addFooter,
  addHeader,
  addTable,
  createPDFDocument,
  finalizePDF,
} from '@/utils/pdf/generate-pdf';

import { warehousesService } from './warehouses.services';

import type {
  CreateWarehouseContext,
  ExportWarehousesContext,
  FullTruckLoadContext,
  ListSectorsContext,
  ListWarehousesContext,
  UpdateWarehouseContext,
  WarehouseIdContext,
} from './warehouses.validators';

export async function listWarehousesHandler(ctx: ListWarehousesContext) {
  const params = ctx.req.valid('query');

  const result = await warehousesService.list(params);

  return sendResponse(ctx, 200, 'Warehouses retrieved successfully', {
    warehouses: result.data,
    pagination: result.pagination,
  });
}

export async function getWarehouseHandler(ctx: WarehouseIdContext) {
  const { id } = ctx.req.valid('param');

  const warehouse = await warehousesService.getById(id);

  return sendResponse(ctx, 200, 'Warehouse retrieved successfully', {
    warehouse,
  });
}

export async function createWarehouseHandler(ctx: CreateWarehouseContext) {
  const data = ctx.req.valid('json');

  const warehouse = await warehousesService.create(data);

  return sendResponse(ctx, 201, 'Warehouse created successfully', {
    warehouse,
  });
}

export async function updateWarehouseHandler(ctx: UpdateWarehouseContext) {
  const { id } = ctx.req.valid('param');
  const data = ctx.req.valid('json');

  const warehouse = await warehousesService.update(id, data);

  return sendResponse(ctx, 200, 'Warehouse updated successfully', {
    warehouse,
  });
}

export async function retireWarehouseHandler(ctx: WarehouseIdContext) {
  const { id } = ctx.req.valid('param');

  const warehouse = await warehousesService.retire(id);

  return sendResponse(ctx, 200, 'Warehouse retired successfully', {
    warehouse,
  });
}

export async function listSectorsHandler(ctx: ListSectorsContext) {
  const params = ctx.req.valid('query');

  const result = await warehousesService.listSectors(params);

  return sendResponse(ctx, 200, 'Sectors retrieved successfully', {
    sectors: result.data,
    pagination: result.pagination,
  });
}

export async function exportWarehousesHandler(ctx: ExportWarehousesContext) {
  const params = ctx.req.valid('query');

  const csv = await warehousesService.exportCSV(params);

  ctx.header('Content-Type', 'text/csv');
  ctx.header(
    'Content-Disposition',
    'attachment; filename="warehouses-export.csv"',
  );

  return ctx.body(csv);
}

export async function fullTruckLoadHandler(ctx: FullTruckLoadContext) {
  const { id } = ctx.req.valid('param');
  const { month, year } = ctx.req.valid('query');

  const result = await warehousesService.getFullTruckLoad(id, month, year);

  if (result.distributions.length === 0) {
    return sendResponse(ctx, 200, 'No distributions found for this warehouse', {
      warehouseName: result.warehouseName,
      distributions: [],
    });
  }

  // Generate PDF
  const doc = createPDFDocument();

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const periodLabel =
    month && year
      ? `${monthNames[month - 1]} ${year}`
      : new Date().toLocaleDateString();

  addHeader(
    doc,
    'Full Truck Load',
    `Warehouse: ${result.warehouseName} — ${periodLabel}`,
    'CTM Media',
  );

  addTable(
    doc,
    [
      { header: '#', width: 30, align: 'center' },
      { header: 'Brochure Name', width: 230 },
      { header: 'Size', width: 45, align: 'center' },
      { header: 'Contract #', width: 115 },
      { header: 'End Date', width: 92, align: 'center' },
    ],
    result.distributions.map((d, i) => ({
      values: [
        String(i + 1),
        d.description,
        d.size,
        d.contractNumber ?? '—',
        d.endDate ?? '—',
      ],
    })),
  );

  addFooter(
    doc,
    `Generated on ${new Date().toLocaleString()} — ${result.distributions.length} brochures`,
  );

  const pdfBuffer = await finalizePDF(doc);
  const filePeriod = month && year ? `${month}-${year}` : 'current';

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="full-truck-load-${result.warehouseName.replace(/[^a-zA-Z0-9-_]/g, '_')}-${filePeriod}.pdf"`,
    },
  });
}
