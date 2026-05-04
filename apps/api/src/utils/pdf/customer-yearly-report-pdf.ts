import PDFDocument from 'pdfkit';

import type {
  CustomerYearlyReportBrochure,
  CustomerYearlyReportResult,
  CustomerYearlyReportVariant,
  CustomerYearlyReportWarehouse,
} from '@/routes/admin/reports/reports.types';

const PAGE_WIDTH = 792;
const PAGE_HEIGHT = 612;
const MARGIN = 30;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const TABLE_X = MARGIN + 12;
const TABLE_WIDTH = CONTENT_WIDTH - 24;
const VARIANT_COLUMN_WIDTHS = [64, 220, 140, 140, 144] as const;

function finalize(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
    doc.end();
  });
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]/g, '_');
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
}

function ensureSpace(doc: PDFKit.PDFDocument, height: number) {
  if (doc.y + height <= PAGE_HEIGHT - MARGIN) return;

  doc.addPage();
}

function drawRule(doc: PDFKit.PDFDocument, y = doc.y) {
  doc
    .moveTo(MARGIN, y)
    .lineTo(PAGE_WIDTH - MARGIN, y)
    .strokeColor('#d1d5db')
    .lineWidth(0.8)
    .stroke();
}

async function loadImageBuffer(url: string | null) {
  if (!url) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1200);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) return null;

    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function loadReportImages(report: CustomerYearlyReportResult) {
  const imageUrls = new Map<string, string | null>();

  for (const warehouse of report.warehouses) {
    for (const brochure of warehouse.brochures) {
      for (const variant of brochure.variants) {
        if (!imageUrls.has(variant.brochureImageId)) {
          imageUrls.set(variant.brochureImageId, variant.imageUrl);
        }
      }
    }
  }

  const imageEntries = await Promise.all(
    Array.from(imageUrls.entries()).map(
      async ([imageId, imageUrl]) =>
        [imageId, await loadImageBuffer(imageUrl)] as const,
    ),
  );

  return new Map(imageEntries);
}

function drawImagePlaceholder(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  size: number,
) {
  doc
    .roundedRect(x, y, size, size, 4)
    .fillAndStroke('#f3f4f6', '#d1d5db')
    .font('Helvetica')
    .fontSize(6.5)
    .fillColor('#6b7280')
    .text('No image', x + 3, y + size / 2 - 4, {
      width: size - 6,
      align: 'center',
    });
}

function drawReportImage(
  doc: PDFKit.PDFDocument,
  imageBuffer: Buffer | null | undefined,
  x: number,
  y: number,
  size = 34,
) {
  if (!imageBuffer) {
    drawImagePlaceholder(doc, x, y, size);
    return;
  }

  try {
    doc.roundedRect(x, y, size, size, 4).strokeColor('#d1d5db').stroke();
    doc.image(imageBuffer, x, y, {
      fit: [size, size],
      align: 'center',
      valign: 'center',
    });
  } catch {
    drawImagePlaceholder(doc, x, y, size);
  }
}

function drawHeader(
  doc: PDFKit.PDFDocument,
  report: CustomerYearlyReportResult,
) {
  doc
    .font('Helvetica-Bold')
    .fontSize(17)
    .fillColor('#111827')
    .text('Customer Year-End Distribution Report', MARGIN, MARGIN);

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#4b5563')
    .text(
      `${report.period.startDate} to ${report.period.endDate}`,
      MARGIN,
      MARGIN + 24,
    )
    .text(
      `Customer: ${report.customer.name} (${report.customer.acumaticaId})`,
      MARGIN,
      MARGIN + 38,
    );

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#6b7280')
    .text(`Generated ${new Date().toLocaleString()}`, MARGIN, MARGIN + 52);

  doc.y = MARGIN + 72;
  drawRule(doc);
  doc.y += 12;
}

function drawSummary(
  doc: PDFKit.PDFDocument,
  report: CustomerYearlyReportResult,
) {
  const columns = [
    ['Warehouses', formatNumber(report.summary.warehouseCount)],
    ['Brochures', formatNumber(report.summary.brochureCount)],
    ['Image/unit variants', formatNumber(report.summary.variantCount)],
    ['Distributed boxes', formatNumber(report.summary.distributionBoxes)],
    ['Distributed units', formatNumber(report.summary.distributionUnits)],
    ['Transactions', formatNumber(report.summary.transactionCount)],
  ] as const;
  const cellWidth = CONTENT_WIDTH / columns.length;
  const startY = doc.y;

  doc.rect(MARGIN, startY, CONTENT_WIDTH, 42).fill('#f9fafb');
  doc.strokeColor('#e5e7eb').rect(MARGIN, startY, CONTENT_WIDTH, 42).stroke();

  columns.forEach(([label, value], index) => {
    const x = MARGIN + index * cellWidth;
    if (index > 0) {
      doc
        .moveTo(x, startY)
        .lineTo(x, startY + 42)
        .strokeColor('#e5e7eb')
        .stroke();
    }

    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor('#6b7280')
      .text(label, x + 8, startY + 8, { width: cellWidth - 16 });
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#111827')
      .text(value, x + 8, startY + 22, { width: cellWidth - 16 });
  });

  doc.y = startY + 56;
}

function drawWarehouseHeader(
  doc: PDFKit.PDFDocument,
  warehouse: CustomerYearlyReportWarehouse,
) {
  ensureSpace(doc, 74);

  const startY = doc.y;
  doc.roundedRect(MARGIN, startY, CONTENT_WIDTH, 52, 5).fill('#f9fafb');
  doc
    .roundedRect(MARGIN, startY, CONTENT_WIDTH, 52, 5)
    .strokeColor('#e5e7eb')
    .stroke();

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#111827')
    .text(truncate(warehouse.name, 44), MARGIN + 12, startY + 10, {
      width: 240,
    });
  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor('#6b7280')
    .text(
      warehouse.acumaticaId ? `Acumatica: ${warehouse.acumaticaId}` : '',
      MARGIN + 12,
      startY + 28,
      { width: 240 },
    );

  const metrics = [
    ['Distributed boxes', formatNumber(warehouse.distributionBoxes)],
    ['Distributed units', formatNumber(warehouse.distributionUnits)],
    ['Brochures', formatNumber(warehouse.brochureCount)],
    ['Transactions', formatNumber(warehouse.transactionCount)],
  ] as const;

  metrics.forEach(([label, value], index) => {
    const x = MARGIN + 274 + index * 112;
    doc
      .font('Helvetica')
      .fontSize(7.2)
      .fillColor('#6b7280')
      .text(label, x, startY + 10, { width: 96, align: 'right' });
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#111827')
      .text(value, x, startY + 27, { width: 96, align: 'right' });
  });

  doc.y = startY + 66;
}

function drawBrochureHeader(
  doc: PDFKit.PDFDocument,
  brochure: CustomerYearlyReportBrochure,
) {
  ensureSpace(doc, 56);

  const startY = doc.y;
  doc.roundedRect(TABLE_X, startY, TABLE_WIDTH, 34, 4).fill('#eef2ff');
  doc
    .roundedRect(TABLE_X, startY, TABLE_WIDTH, 34, 4)
    .strokeColor('#c7d2fe')
    .stroke();

  doc
    .font('Helvetica-Bold')
    .fontSize(9.2)
    .fillColor('#111827')
    .text(
      `${truncate(brochure.name, 58)} - ${formatNumber(brochure.distributionBoxes)} distributed boxes`,
      TABLE_X + 10,
      startY + 7,
      { width: 420 },
    );
  doc
    .font('Helvetica')
    .fontSize(7.3)
    .fillColor('#4b5563')
    .text(
      `${brochure.brochureTypeName} - ${formatNumber(brochure.variantCount)} image/unit variants`,
      TABLE_X + 10,
      startY + 20,
      { width: 420 },
    );

  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor('#312e81')
    .text(
      `${formatNumber(brochure.distributionUnits)} units`,
      TABLE_X + 514,
      startY + 7,
      {
        width: 86,
        align: 'right',
      },
    )
    .text(
      `${formatNumber(brochure.transactionCount)} txns`,
      TABLE_X + 612,
      startY + 7,
      {
        width: 76,
        align: 'right',
      },
    );

  doc.y = startY + 42;
}

function drawVariantTableHeader(doc: PDFKit.PDFDocument) {
  ensureSpace(doc, 24);

  const headers = [
    'Image',
    'Units per box',
    'Distributed boxes',
    'Distributed units',
    'Transactions',
  ];
  const startY = doc.y;

  doc.rect(TABLE_X, startY, TABLE_WIDTH, 18).fill('#f3f4f6');
  doc.strokeColor('#e5e7eb').rect(TABLE_X, startY, TABLE_WIDTH, 18).stroke();

  let x = TABLE_X;
  headers.forEach((header, index) => {
    doc
      .font('Helvetica-Bold')
      .fontSize(7.2)
      .fillColor('#374151')
      .text(header, x + 6, startY + 5.5, {
        width: VARIANT_COLUMN_WIDTHS[index]! - 12,
        align: index >= 2 ? 'right' : 'left',
      });
    x += VARIANT_COLUMN_WIDTHS[index]!;
  });

  doc.y = startY + 18;
}

function drawVariantRow(params: {
  doc: PDFKit.PDFDocument;
  variant: CustomerYearlyReportVariant;
  imageBuffer: Buffer | null | undefined;
}) {
  const { doc, imageBuffer, variant } = params;
  ensureSpace(doc, 50);

  const rowY = doc.y;
  doc.rect(TABLE_X, rowY, TABLE_WIDTH, 46).fill('#ffffff');
  doc.strokeColor('#e5e7eb').rect(TABLE_X, rowY, TABLE_WIDTH, 46).stroke();

  let x = TABLE_X;
  drawReportImage(doc, imageBuffer, x + 15, rowY + 6, 34);
  x += VARIANT_COLUMN_WIDTHS[0];

  doc
    .font('Helvetica-Bold')
    .fontSize(8.4)
    .fillColor('#111827')
    .text(`${formatNumber(variant.unitsPerBox)} units/box`, x + 6, rowY + 12, {
      width: VARIANT_COLUMN_WIDTHS[1] - 12,
    });
  doc
    .font('Helvetica')
    .fontSize(7.2)
    .fillColor('#6b7280')
    .text('Image and pack-size variant', x + 6, rowY + 26, {
      width: VARIANT_COLUMN_WIDTHS[1] - 12,
    });
  x += VARIANT_COLUMN_WIDTHS[1];

  const values = [
    formatNumber(variant.distributionBoxes),
    formatNumber(variant.distributionUnits),
    formatNumber(variant.transactionCount),
  ];

  values.forEach((value, index) => {
    const width = VARIANT_COLUMN_WIDTHS[index + 2]!;
    doc
      .font(index === 0 ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(8.5)
      .fillColor(index === 0 ? '#111827' : '#374151')
      .text(value, x + 6, rowY + 17, {
        width: width - 12,
        align: 'right',
      });
    x += width;
  });

  doc.y = rowY + 46;
}

function drawBrochure(params: {
  doc: PDFKit.PDFDocument;
  brochure: CustomerYearlyReportBrochure;
  images: Map<string, Buffer | null>;
}) {
  const { brochure, doc, images } = params;

  drawBrochureHeader(doc, brochure);
  drawVariantTableHeader(doc);

  for (const variant of brochure.variants) {
    drawVariantRow({
      doc,
      variant,
      imageBuffer: images.get(variant.brochureImageId),
    });
  }

  doc.y += 12;
}

function drawWarehouse(params: {
  doc: PDFKit.PDFDocument;
  warehouse: CustomerYearlyReportWarehouse;
  images: Map<string, Buffer | null>;
}) {
  const { doc, images, warehouse } = params;

  drawWarehouseHeader(doc, warehouse);

  for (const brochure of warehouse.brochures) {
    drawBrochure({ doc, brochure, images });
  }
}

function drawEmptyReport(doc: PDFKit.PDFDocument) {
  ensureSpace(doc, 80);

  const startY = doc.y;
  doc
    .roundedRect(MARGIN, startY, CONTENT_WIDTH, 68, 5)
    .fillAndStroke('#f9fafb', '#e5e7eb');
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#111827')
    .text(
      'No distributions found for this customer in this year.',
      MARGIN + 16,
      startY + 18,
    );
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#6b7280')
    .text(
      'Choose another customer or year to generate a report.',
      MARGIN + 16,
      startY + 38,
    );

  doc.y = startY + 80;
}

export async function generateCustomerYearlyReportPDF(
  report: CustomerYearlyReportResult,
) {
  const doc = new PDFDocument({
    size: 'LETTER',
    layout: 'landscape',
    margin: MARGIN,
    bufferPages: true,
    info: {
      Title: `Customer Year-End Distribution Report - ${report.customer.name} - ${report.period.year}`,
      Author: 'Certified Travel Media',
    },
  });
  const images = await loadReportImages(report);

  drawHeader(doc, report);
  drawSummary(doc, report);

  if (report.summary.transactionCount === 0) {
    drawEmptyReport(doc);
  } else {
    for (const warehouse of report.warehouses) {
      drawWarehouse({ doc, warehouse, images });
    }
  }

  const range = doc.bufferedPageRange();
  for (let index = 0; index < range.count; index++) {
    doc.switchToPage(index);
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor('#9ca3af')
      .text(`Page ${index + 1} of ${range.count}`, MARGIN, PAGE_HEIGHT - 22, {
        width: CONTENT_WIDTH,
        align: 'right',
      });
  }

  return {
    buffer: await finalize(doc),
    filename: `customer-year-end-distribution-report-${safeFilename(report.customer.name)}-${report.period.year}.pdf`,
  };
}
