import PDFDocument from 'pdfkit';

import type { CustomerYearlyReportResult } from '@/routes/admin/reports/reports.types';

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

function drawHeader(
  doc: PDFKit.PDFDocument,
  report: CustomerYearlyReportResult,
) {
  doc
    .font('Helvetica-Bold')
    .fontSize(17)
    .fillColor('#111827')
    .text('Customer Year-End Inventory Report', MARGIN, MARGIN);

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
    ['Items', formatNumber(report.summary.inventoryItemCount)],
    ['Transactions', formatNumber(report.summary.transactionCount)],
    ['Year start', formatNumber(report.summary.startingBalanceBoxes)],
    ['Year end', formatNumber(report.summary.endingBalanceBoxes)],
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

function drawMonthHeader(
  doc: PDFKit.PDFDocument,
  month: CustomerYearlyReportResult['months'][number],
) {
  ensureSpace(doc, 72);

  const startY = doc.y;
  doc.roundedRect(MARGIN, startY, CONTENT_WIDTH, 50, 5).fill('#f9fafb');
  doc
    .roundedRect(MARGIN, startY, CONTENT_WIDTH, 50, 5)
    .strokeColor('#e5e7eb')
    .stroke();

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#111827')
    .text(month.label, MARGIN + 12, startY + 11, { width: 150 });
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#6b7280')
    .text(`${month.transactionCount} transactions`, MARGIN + 12, startY + 29, {
      width: 150,
    });

  const metrics = [
    ['Start', formatNumber(month.startingBalanceBoxes)],
    ['Movement', formatMovement(month.netMovementBoxes)],
    ['End', formatNumber(month.endingBalanceBoxes)],
    ['End units', formatNumber(month.endingBalanceUnits)],
  ] as const;

  metrics.forEach(([label, value], index) => {
    const x = MARGIN + 258 + index * 112;
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor('#6b7280')
      .text(label, x, startY + 10, { width: 96, align: 'right' });
    doc
      .font('Helvetica-Bold')
      .fontSize(10.5)
      .fillColor('#111827')
      .text(value, x, startY + 27, { width: 96, align: 'right' });
  });

  doc.y = startY + 62;
}

function drawTransactionTable(
  doc: PDFKit.PDFDocument,
  item: CustomerYearlyReportResult['months'][number]['items'][number],
) {
  const tableX = MARGIN + 24;
  const widths = [58, 90, 68, 68, 68, 298];
  const headers = ['Date', 'Type', 'Move', 'Before', 'After', 'Notes'];

  let y = doc.y;
  doc.rect(tableX, y, CONTENT_WIDTH - 24, 19).fill('#eef2ff');
  doc
    .strokeColor('#c7d2fe')
    .rect(tableX, y, CONTENT_WIDTH - 24, 19)
    .stroke();

  let x = tableX;
  headers.forEach((header, index) => {
    doc
      .font('Helvetica-Bold')
      .fontSize(7.3)
      .fillColor('#312e81')
      .text(header, x + 5, y + 6, { width: widths[index]! - 10 });
    x += widths[index]!;
  });

  doc.y = y + 19;

  for (const transaction of item.transactions) {
    ensureSpace(doc, 24);
    y = doc.y;
    doc
      .rect(tableX, y, CONTENT_WIDTH - 24, 22)
      .strokeColor('#e5e7eb')
      .stroke();

    const values = [
      formatDate(transaction.transactionDate),
      transaction.transactionType,
      formatMovement(transaction.movementBoxes),
      formatNumber(transaction.balanceBeforeBoxes),
      formatNumber(transaction.balanceAfterBoxes),
      transaction.notes ? truncate(transaction.notes, 112) : '-',
    ];

    x = tableX;
    values.forEach((value, index) => {
      doc
        .font(index === 2 ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(7.3)
        .fillColor(index === 2 ? '#111827' : '#374151')
        .text(value, x + 5, y + 7, {
          width: widths[index]! - 10,
          align: index >= 2 && index <= 4 ? 'right' : 'left',
        });
      x += widths[index]!;
    });

    doc.y = y + 22;
  }

  doc.y += 10;
}

function drawItemTransactions(
  doc: PDFKit.PDFDocument,
  item: CustomerYearlyReportResult['months'][number]['items'][number],
) {
  ensureSpace(doc, 58);

  const startY = doc.y;
  doc
    .font('Helvetica-Bold')
    .fontSize(9.2)
    .fillColor('#111827')
    .text(truncate(item.brochureName, 54), MARGIN + 24, startY, {
      width: 265,
    });
  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor('#6b7280')
    .text(
      `${item.warehouseName} - ${item.brochureTypeName} - ${formatNumber(item.unitsPerBox)} units/box`,
      MARGIN + 24,
      startY + 14,
      { width: 335 },
    );

  const balances = [
    ['Start', formatNumber(item.startingBalanceBoxes)],
    ['End', formatNumber(item.endingBalanceBoxes)],
    ['Move', formatMovement(item.netMovementBoxes)],
  ] as const;

  balances.forEach(([label, value], index) => {
    const x = MARGIN + 440 + index * 86;
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#6b7280')
      .text(label, x, startY, { width: 74, align: 'right' });
    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor('#111827')
      .text(value, x, startY + 13, { width: 74, align: 'right' });
  });

  doc.y = startY + 30;
  drawTransactionTable(doc, item);
}

function drawMonth(
  doc: PDFKit.PDFDocument,
  month: CustomerYearlyReportResult['months'][number],
) {
  drawMonthHeader(doc, month);

  const transactionItems = month.items.filter(
    (item) => item.transactionCount > 0,
  );

  if (transactionItems.length === 0) {
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#6b7280')
      .text(
        'No recorded transactions for this customer in this month.',
        MARGIN + 24,
        doc.y,
        {
          width: CONTENT_WIDTH - 24,
        },
      );
    doc.y += 22;
    return;
  }

  for (const item of transactionItems) {
    drawItemTransactions(doc, item);
  }
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
    .text('No inventory found for this customer.', MARGIN + 16, doc.y + 18);
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#6b7280')
    .text(
      'Choose another customer or year to generate a report.',
      MARGIN + 16,
      doc.y + 38,
    );
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
      Title: `Customer Year-End Inventory Report - ${report.customer.name} - ${report.period.year}`,
      Author: 'Certified Travel Media',
    },
  });

  drawHeader(doc, report);
  drawSummary(doc, report);

  if (report.summary.inventoryItemCount === 0) {
    drawEmptyReport(doc);
  } else {
    for (const month of report.months) {
      drawMonth(doc, month);
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
    filename: `customer-year-end-report-${safeFilename(report.customer.name)}-${report.period.year}.pdf`,
  };
}
