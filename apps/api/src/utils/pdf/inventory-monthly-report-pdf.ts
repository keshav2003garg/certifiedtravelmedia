import PDFDocument from 'pdfkit';

import type { InventoryMonthlyReportResult } from '@/routes/admin/reports/reports.types';

const PAGE_WIDTH = 792;
const PAGE_HEIGHT = 612;
const MARGIN = 30;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

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

function formatMovement(value: number) {
  if (value > 0) return `+${formatNumber(value)}`;
  return formatNumber(value);
}

function formatDate(value: string) {
  const [year, month, day] = value.split('-');
  return `${month}/${day}/${year}`;
}

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]/g, '_');
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1))}…`;
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

function drawHeader(
  doc: PDFKit.PDFDocument,
  report: InventoryMonthlyReportResult,
) {
  doc
    .font('Helvetica-Bold')
    .fontSize(17)
    .fillColor('#111827')
    .text('Inventory Monthly Report', MARGIN, MARGIN);

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#4b5563')
    .text(
      `${report.period.label} • ${report.period.startDate} to ${report.period.endDate}`,
      MARGIN,
      MARGIN + 24,
    )
    .text(
      `Warehouse: ${report.warehouse.name}${report.warehouse.acumaticaId ? ` (${report.warehouse.acumaticaId})` : ''}`,
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
  report: InventoryMonthlyReportResult,
) {
  const columns = [
    ['Items', formatNumber(report.summary.inventoryItemCount)],
    ['Transactions', formatNumber(report.summary.transactionCount)],
    ['Starting boxes', formatNumber(report.summary.startingBalanceBoxes)],
    ['Ending boxes', formatNumber(report.summary.endingBalanceBoxes)],
    ['Net movement', formatMovement(report.summary.netMovementBoxes)],
    ['Ending units', formatNumber(report.summary.endingBalanceUnits)],
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

async function loadReportImages(report: InventoryMonthlyReportResult) {
  const imageEntries = await Promise.all(
    report.items.map(
      async (item) => [item.id, await loadImageBuffer(item.imageUrl)] as const,
    ),
  );

  return new Map(imageEntries);
}

function drawImagePlaceholder(doc: PDFKit.PDFDocument, x: number, y: number) {
  doc
    .roundedRect(x, y, 42, 42, 4)
    .fillAndStroke('#f3f4f6', '#d1d5db')
    .font('Helvetica')
    .fontSize(7)
    .fillColor('#6b7280')
    .text('No image', x + 4, y + 17, { width: 34, align: 'center' });
}

function drawReportImage(
  doc: PDFKit.PDFDocument,
  imageBuffer: Buffer | null | undefined,
  x: number,
  y: number,
) {
  if (!imageBuffer) {
    drawImagePlaceholder(doc, x, y);
    return;
  }

  try {
    doc.roundedRect(x, y, 42, 42, 4).strokeColor('#d1d5db').stroke();
    doc.image(imageBuffer, x, y, {
      fit: [42, 42],
      align: 'center',
      valign: 'center',
    });
  } catch {
    drawImagePlaceholder(doc, x, y);
  }
}

function drawItemHeader(
  doc: PDFKit.PDFDocument,
  item: InventoryMonthlyReportResult['items'][number],
  imageBuffer: Buffer | null | undefined,
) {
  ensureSpace(doc, 94);

  const startY = doc.y;
  doc.roundedRect(MARGIN, startY, CONTENT_WIDTH, 72, 5).fill('#f9fafb');
  doc
    .roundedRect(MARGIN, startY, CONTENT_WIDTH, 72, 5)
    .strokeColor('#e5e7eb')
    .stroke();
  drawReportImage(doc, imageBuffer, MARGIN + 10, startY + 15);

  doc
    .font('Helvetica-Bold')
    .fontSize(10.5)
    .fillColor('#111827')
    .text(truncate(item.brochureName, 64), MARGIN + 62, startY + 12, {
      width: 250,
    });
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#4b5563')
    .text(
      truncate(item.customerName ?? 'Unassigned customer', 54),
      MARGIN + 62,
      startY + 28,
      {
        width: 250,
      },
    )
    .text(
      `${item.brochureTypeName} • ${formatNumber(item.unitsPerBox)} units/box`,
      MARGIN + 62,
      startY + 42,
      {
        width: 250,
      },
    );

  const metrics = [
    ['Start', formatNumber(item.startingBalanceBoxes)],
    ['Movement', formatMovement(item.netMovementBoxes)],
    ['End', formatNumber(item.endingBalanceBoxes)],
    ['End units', formatNumber(item.endingBalanceUnits)],
  ] as const;

  metrics.forEach(([label, value], index) => {
    const x = MARGIN + 335 + index * 94;
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor('#6b7280')
      .text(label, x, startY + 16, { width: 82, align: 'right' });
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#111827')
      .text(value, x, startY + 32, { width: 82, align: 'right' });
  });

  doc.y = startY + 84;
}

function drawTransactionsTable(
  doc: PDFKit.PDFDocument,
  item: InventoryMonthlyReportResult['items'][number],
) {
  const tableX = MARGIN + 24;
  const widths = [58, 92, 68, 68, 68, 296];
  const headers = ['Date', 'Type', 'Movement', 'Before', 'After', 'Notes'];

  ensureSpace(doc, 44);

  if (item.transactions.length === 0) {
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#6b7280')
      .text(
        'No transactions in this period. Starting and ending balance are unchanged.',
        tableX,
        doc.y,
        {
          width: CONTENT_WIDTH - 24,
        },
      );
    doc.y += 20;
    return;
  }

  let y = doc.y;
  doc.rect(tableX, y, CONTENT_WIDTH - 24, 20).fill('#eef2ff');
  doc
    .strokeColor('#c7d2fe')
    .rect(tableX, y, CONTENT_WIDTH - 24, 20)
    .stroke();

  let x = tableX;
  headers.forEach((header, index) => {
    doc
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .fillColor('#312e81')
      .text(header, x + 5, y + 6, { width: widths[index]! - 10 });
    x += widths[index]!;
  });

  y += 20;

  for (const transaction of item.transactions) {
    ensureSpace(doc, 24);
    y = doc.y;
    doc
      .rect(tableX, y, CONTENT_WIDTH - 24, 23)
      .strokeColor('#e5e7eb')
      .stroke();

    const values = [
      formatDate(transaction.transactionDate),
      transaction.transactionType,
      formatMovement(transaction.movementBoxes),
      formatNumber(transaction.balanceBeforeBoxes),
      formatNumber(transaction.balanceAfterBoxes),
      transaction.notes ? truncate(transaction.notes, 110) : '—',
    ];

    x = tableX;
    values.forEach((value, index) => {
      doc
        .font(index === 2 ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(7.5)
        .fillColor(index === 2 ? '#111827' : '#374151')
        .text(value, x + 5, y + 7, {
          width: widths[index]! - 10,
          align: index >= 2 && index <= 4 ? 'right' : 'left',
        });
      x += widths[index]!;
    });

    doc.y = y + 23;
  }

  doc.y += 14;
}

function drawEmptyReport(doc: PDFKit.PDFDocument) {
  ensureSpace(doc, 80);
  doc
    .roundedRect(MARGIN, doc.y, CONTENT_WIDTH, 68, 5)
    .fillAndStroke('#f9fafb', '#e5e7eb');
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#111827')
    .text('No inventory found for this warehouse.', MARGIN + 16, doc.y + 18);
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#6b7280')
    .text(
      'Choose another warehouse or period to generate a report.',
      MARGIN + 16,
      doc.y + 38,
    );
}

export async function generateInventoryMonthlyReportPDF(
  report: InventoryMonthlyReportResult,
) {
  const doc = new PDFDocument({
    size: 'LETTER',
    layout: 'landscape',
    margin: MARGIN,
    bufferPages: true,
    info: {
      Title: `Inventory Monthly Report - ${report.warehouse.name} - ${report.period.label}`,
      Author: 'Certified Travel Media',
    },
  });
  const imagesByItemId = await loadReportImages(report);

  drawHeader(doc, report);
  drawSummary(doc, report);

  if (report.items.length === 0) {
    drawEmptyReport(doc);
  }

  for (const item of report.items) {
    drawItemHeader(doc, item, imagesByItemId.get(item.id));
    drawTransactionsTable(doc, item);
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
    filename: `inventory-report-${safeFilename(report.warehouse.name)}-${report.period.month}-${report.period.year}.pdf`,
  };
}
