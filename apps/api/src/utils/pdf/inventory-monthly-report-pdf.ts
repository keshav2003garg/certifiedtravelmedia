import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import PDFDocument from 'pdfkit';
import sharp from 'sharp';

import type { InventoryMonthlyReportResult } from '@/routes/admin/reports/reports.types';

const PAGE_WIDTH = 792;
const PAGE_HEIGHT = 612;
const MARGIN = 32;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const TABLE_X = MARGIN;
const TABLE_WIDTH = CONTENT_WIDTH;
const FOOTER_Y = PAGE_HEIGHT - 24;
const CONTENT_BOTTOM_Y = FOOTER_Y - 14;
const ITEM_IMAGE_WIDTH = 82;
const ITEM_IMAGE_HEIGHT = 54;
const ITEM_INFO_WIDTH = 324;
const ITEM_HEADER_HEIGHT = 28;
const ITEM_DETAIL_HEIGHT = 70;
const ITEM_GROUP_GAP = 18;
const TRANSACTION_TABLE_TOP_GAP = 0;
const TRANSACTION_HEADER_HEIGHT = 24;
const TRANSACTION_ROW_HEIGHT = 25;
const TRANSACTION_TABLE_X = TABLE_X;
const TRANSACTION_TABLE_WIDTH = TABLE_WIDTH;
const IMAGE_TIMEOUT_MS = 3500;
const IMAGE_FETCH_CONCURRENCY = 8;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const COLORS = {
  background: '#ffffff',
  foreground: '#1a2d42',
  mutedForeground: '#7e8792',
  primary: '#0089cf',
  primaryDark: '#006ba3',
  secondary: '#f5f7fa',
  muted: '#f8f9fa',
  border: '#e2e8f0',
  accent: '#fecf04',
  navy: '#0e385e',
  navyDark: '#0a2945',
  infoMuted: '#cce7f5',
  white: '#ffffff',
  success: '#047857',
  danger: '#b42318',
} as const;

const LOGO_PATH_CANDIDATES = [
  resolve(process.cwd(), 'apps/admin/public/logo.png'),
  resolve(process.cwd(), 'apps/charts/public/logo.png'),
  resolve(process.cwd(), '../admin/public/logo.png'),
  resolve(process.cwd(), '../charts/public/logo.png'),
  resolve(process.cwd(), 'public/logo.png'),
] as const;

const TRANSACTION_COLUMNS = [
  { label: 'Date', width: 82, align: 'left' },
  { label: 'Type', width: 104, align: 'left' },
  { label: 'Boxes', width: 92, align: 'right' },
  { label: 'Units', width: 92, align: 'right' },
  { label: 'Before', width: 92, align: 'right' },
  { label: 'After', width: 92, align: 'right' },
  { label: 'Notes', width: TRANSACTION_TABLE_WIDTH - 554, align: 'left' },
] as const;

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

function formatOrdinalDate(value: string) {
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;

  const dayNum = parseInt(day, 10);
  const suffix =
    dayNum === 11 || dayNum === 12 || dayNum === 13
      ? 'th'
      : dayNum % 10 === 1
        ? 'st'
        : dayNum % 10 === 2
          ? 'nd'
          : dayNum % 10 === 3
            ? 'rd'
            : 'th';
  const monthName = new Date(Number(year), Number(month) - 1, 1).toLocaleString(
    'en-US',
    {
      month: 'long',
    },
  );

  return `${dayNum}${suffix} ${monthName}, ${year}`;
}

function formatShortDate(value: string) {
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(Number(year), Number(month) - 1, Number(day)));
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
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
  if (doc.y + height <= CONTENT_BOTTOM_Y) return false;

  doc.addPage();
  doc.y = MARGIN;
  return true;
}

function strokeGroupBox(params: {
  doc: PDFKit.PDFDocument;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}) {
  const { color = COLORS.primary, doc, height, width, x, y } = params;

  doc.rect(x, y, width, height).lineWidth(1.1).strokeColor(color).stroke();
}

function getCurrentPageIndex(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();
  return range.start + range.count - 1;
}

interface PageGroupBox {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

function addPageSpanningGroupBoxes(params: {
  boxes: PageGroupBox[];
  startPageIndex: number;
  startY: number;
  endPageIndex: number;
  endY: number;
  x: number;
  width: number;
}) {
  const { boxes, endPageIndex, endY, startPageIndex, startY, width, x } =
    params;

  for (let pageIndex = startPageIndex; pageIndex <= endPageIndex; pageIndex++) {
    const y = pageIndex === startPageIndex ? startY : MARGIN;
    const bottomY = pageIndex === endPageIndex ? endY : CONTENT_BOTTOM_Y;

    if (bottomY <= y) continue;

    boxes.push({
      pageIndex,
      x,
      y,
      width,
      height: bottomY - y,
    });
  }
}

function drawPageGroupBoxes(doc: PDFKit.PDFDocument, boxes: PageGroupBox[]) {
  const restorePageIndex = getCurrentPageIndex(doc);

  for (const box of boxes) {
    doc.switchToPage(box.pageIndex);
    strokeGroupBox({
      doc,
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
    });
  }

  doc.switchToPage(restorePageIndex);
}

function drawRule(doc: PDFKit.PDFDocument, y = doc.y) {
  doc
    .moveTo(MARGIN, y)
    .lineTo(PAGE_WIDTH - MARGIN, y)
    .strokeColor(COLORS.border)
    .lineWidth(0.7)
    .stroke();
}

function drawText(
  doc: PDFKit.PDFDocument,
  params: {
    text: string;
    x: number;
    y: number;
    width: number;
    font?: 'Helvetica' | 'Helvetica-Bold';
    size?: number;
    color?: string;
    align?: 'left' | 'center' | 'right';
    height?: number;
    lineBreak?: boolean;
    ellipsis?: boolean | string;
  },
) {
  const {
    align = 'left',
    color = COLORS.foreground,
    ellipsis,
    font = 'Helvetica',
    height,
    lineBreak = true,
    size = 8,
    text,
    width,
    x,
    y,
  } = params;

  doc.font(font).fontSize(size).fillColor(color).text(text, x, y, {
    align,
    ellipsis,
    height,
    lineBreak,
    width,
  });
}

function drawCell(params: {
  doc: PDFKit.PDFDocument;
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
}) {
  const {
    doc,
    fill = COLORS.white,
    height,
    stroke = COLORS.border,
    width,
    x,
    y,
  } = params;

  doc.rect(x, y, width, height).fillAndStroke(fill, stroke);
}

async function loadLogoBuffer() {
  const results = await Promise.allSettled(
    LOGO_PATH_CANDIDATES.map((path) => readFile(path)),
  );

  for (const result of results) {
    if (result.status === 'fulfilled') return Buffer.from(result.value);
  }

  return null;
}

function drawLogoFallback(doc: PDFKit.PDFDocument, x: number, y: number) {
  doc
    .circle(x + 26, y + 24, 22)
    .lineWidth(4)
    .strokeColor(COLORS.navy)
    .stroke();
  doc.rect(x + 17, y + 15, 14, 14).fill(COLORS.accent);
  doc.rect(x + 31, y + 29, 14, 14).fill(COLORS.accent);
  drawText(doc, {
    text: 'CERTIFIED',
    x: x + 60,
    y: y + 6,
    width: 130,
    font: 'Helvetica-Bold',
    size: 18,
    color: COLORS.navy,
  });
  drawText(doc, {
    text: 'TRAVEL MEDIA',
    x: x + 60,
    y: y + 29,
    width: 150,
    font: 'Helvetica-Bold',
    size: 18,
    color: COLORS.primary,
  });
}

function drawLogo(
  doc: PDFKit.PDFDocument,
  logoBuffer: Buffer | null,
  y: number,
) {
  const width = 190;
  const height = 72;
  const x = (PAGE_WIDTH - width) / 2;

  if (!logoBuffer) {
    drawLogoFallback(doc, x - 10, y + 4);
    return;
  }

  try {
    doc.image(logoBuffer, x, y, {
      fit: [width, height],
      align: 'center',
      valign: 'center',
    });
  } catch {
    drawLogoFallback(doc, x - 10, y + 4);
  }
}

function isHttpImageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function parseDataImageBuffer(value: string) {
  const match =
    /^data:image\/[a-zA-Z0-9.+-]+(;charset=[^;,]+)?(;base64)?,(.*)$/s.exec(
      value,
    );
  if (!match) return null;

  const isBase64 = Boolean(match[2]);
  const payload = match[3] ?? '';

  try {
    const buffer = isBase64
      ? Buffer.from(payload, 'base64')
      : Buffer.from(decodeURIComponent(payload), 'utf8');

    return buffer.byteLength <= MAX_IMAGE_BYTES ? buffer : null;
  } catch {
    return null;
  }
}

async function fetchImageBuffer(url: string | null) {
  if (!url) return null;

  const dataImageBuffer = parseDataImageBuffer(url);
  if (dataImageBuffer) return dataImageBuffer;
  if (!isHttpImageUrl(url)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;

    const contentLength = response.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_IMAGE_BYTES) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.byteLength <= MAX_IMAGE_BYTES ? buffer : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function normalizeItemImage(buffer: Buffer) {
  try {
    return await sharp(buffer)
      .rotate()
      .flatten({ background: COLORS.white })
      .resize(ITEM_IMAGE_WIDTH * 3, ITEM_IMAGE_HEIGHT * 3, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer();
  } catch {
    return buffer;
  }
}

async function loadReportImages(report: InventoryMonthlyReportResult) {
  const entries = report.items.map((item) => [item.id, item.imageUrl] as const);
  const images = new Map<string, Buffer | null>();
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < entries.length) {
      const index = nextIndex;
      nextIndex += 1;

      const entry = entries[index];
      if (!entry) continue;

      const [itemId, imageUrl] = entry;
      const buffer = await fetchImageBuffer(imageUrl);
      images.set(itemId, buffer ? await normalizeItemImage(buffer) : null);
    }
  };

  await Promise.all(
    Array.from(
      { length: Math.min(IMAGE_FETCH_CONCURRENCY, entries.length) },
      () => worker(),
    ),
  );

  return images;
}

function drawImagePlaceholder(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width = ITEM_IMAGE_WIDTH,
  height = ITEM_IMAGE_HEIGHT,
) {
  drawCell({ doc, x, y, width, height, fill: COLORS.muted });
  drawText(doc, {
    text: 'No image',
    x,
    y: y + height / 2 - 4,
    width,
    align: 'center',
    size: 7,
    color: COLORS.mutedForeground,
  });
}

function drawReportImage(
  doc: PDFKit.PDFDocument,
  imageBuffer: Buffer | null | undefined,
  x: number,
  y: number,
  width = ITEM_IMAGE_WIDTH,
  height = ITEM_IMAGE_HEIGHT,
) {
  if (!imageBuffer) {
    drawImagePlaceholder(doc, x, y, width, height);
    return;
  }

  try {
    doc.image(imageBuffer, x, y, {
      fit: [width, height],
      align: 'center',
      valign: 'center',
    });
  } catch {
    drawImagePlaceholder(doc, x, y, width, height);
  }
}

function drawHeader(
  doc: PDFKit.PDFDocument,
  report: InventoryMonthlyReportResult,
  logoBuffer: Buffer | null,
) {
  doc.rect(0, 0, PAGE_WIDTH, 9).fill(COLORS.primary);
  doc.rect(0, 9, PAGE_WIDTH, 2.5).fill(COLORS.accent);

  drawLogo(doc, logoBuffer, 22);

  drawText(doc, {
    text: 'Monthly Inventory Report',
    x: MARGIN,
    y: 106,
    width: CONTENT_WIDTH,
    align: 'center',
    font: 'Helvetica-Bold',
    size: 20,
    color: COLORS.navy,
  });
  drawText(doc, {
    text: 'Warehouse inventory movement summary',
    x: MARGIN,
    y: 130,
    width: CONTENT_WIDTH,
    align: 'center',
    size: 9,
    color: COLORS.mutedForeground,
  });

  const metaY = 154;
  const metaHeight = 50;
  const metaColumns = [
    {
      label: 'Warehouse',
      value: report.warehouse.name,
      width: 280,
    },
    {
      label: 'Warehouse ID',
      value: report.warehouse.acumaticaId || 'N/A',
      width: 126,
    },
    {
      label: 'Report Month',
      value: report.period.label,
      width: 112,
    },
    {
      label: 'Period',
      value: `${formatOrdinalDate(report.period.startDate)} to ${formatOrdinalDate(report.period.endDate)}`,
      width: CONTENT_WIDTH - 280 - 126 - 112,
      valueSize: 8,
    },
  ];
  let x = MARGIN;

  for (const column of metaColumns) {
    drawCell({
      doc,
      x,
      y: metaY,
      width: column.width,
      height: metaHeight,
      fill: COLORS.white,
      stroke: COLORS.border,
    });
    drawText(doc, {
      text: column.label.toUpperCase(),
      x: x + 10,
      y: metaY + 9,
      width: column.width - 20,
      font: 'Helvetica-Bold',
      size: 6.8,
      color: COLORS.primaryDark,
    });
    drawText(doc, {
      text: truncate(column.value, column.width > 200 ? 58 : 24),
      x: x + 10,
      y: metaY + 25,
      width: column.width - 20,
      font: 'Helvetica-Bold',
      size:
        'valueSize' in column
          ? column.valueSize
          : column.width > 200
            ? 11
            : 9.5,
      color: COLORS.foreground,
      height: 16,
    });
    x += column.width;
  }

  doc.y = metaY + metaHeight + 16;
}

function drawSummary(
  doc: PDFKit.PDFDocument,
  report: InventoryMonthlyReportResult,
) {
  const columns = [
    {
      label: 'Items',
      value: formatNumber(report.summary.inventoryItemCount),
    },
    {
      label: 'Transactions',
      value: formatNumber(report.summary.transactionCount),
    },
    {
      label: 'Starting boxes',
      value: formatNumber(report.summary.startingBalanceBoxes),
    },
    {
      label: 'Ending boxes',
      value: formatNumber(report.summary.endingBalanceBoxes),
    },
    {
      label: 'Net movement',
      value: formatMovement(report.summary.netMovementBoxes),
      color:
        report.summary.netMovementBoxes < 0
          ? COLORS.danger
          : report.summary.netMovementBoxes > 0
            ? COLORS.success
            : COLORS.navy,
    },
    {
      label: 'Ending units',
      value: formatNumber(report.summary.endingBalanceUnits),
    },
  ];
  const cellWidth = CONTENT_WIDTH / columns.length;
  const startY = doc.y;

  doc.rect(MARGIN, startY, CONTENT_WIDTH, 4).fill(COLORS.accent);

  columns.forEach((column, index) => {
    const x = MARGIN + index * cellWidth;
    drawCell({
      doc,
      x,
      y: startY + 4,
      width: cellWidth,
      height: 48,
      fill: index % 2 === 0 ? COLORS.secondary : COLORS.white,
      stroke: COLORS.border,
    });
    drawText(doc, {
      text: column.label.toUpperCase(),
      x: x + 9,
      y: startY + 14,
      width: cellWidth - 18,
      font: 'Helvetica-Bold',
      size: 6.6,
      color: COLORS.mutedForeground,
    });
    drawText(doc, {
      text: column.value,
      x: x + 9,
      y: startY + 29,
      width: cellWidth - 18,
      font: 'Helvetica-Bold',
      size: 12,
      color: 'color' in column ? column.color : COLORS.navy,
    });
  });

  doc.y = startY + 68;
}

function formatTransactionType(value: string) {
  return value
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(
      (part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`,
    )
    .join(' ');
}

function getMovementColor(value: number) {
  if (value > 0) return COLORS.success;
  if (value < 0) return COLORS.danger;
  return COLORS.foreground;
}

function drawItemHeader(
  doc: PDFKit.PDFDocument,
  item: InventoryMonthlyReportResult['items'][number],
  imageBuffer: Buffer | null | undefined,
) {
  ensureSpace(
    doc,
    ITEM_HEADER_HEIGHT +
      ITEM_DETAIL_HEIGHT +
      TRANSACTION_TABLE_TOP_GAP +
      TRANSACTION_HEADER_HEIGHT +
      TRANSACTION_ROW_HEIGHT +
      8,
  );

  const startY = doc.y;
  const startPageIndex = getCurrentPageIndex(doc);
  doc.rect(TABLE_X, startY, TABLE_WIDTH, ITEM_HEADER_HEIGHT).fill(COLORS.navy);
  doc.rect(TABLE_X, startY, 5, ITEM_HEADER_HEIGHT).fill(COLORS.accent);
  doc
    .rect(TABLE_X, startY, TABLE_WIDTH, ITEM_HEADER_HEIGHT)
    .lineWidth(0.8)
    .strokeColor(COLORS.navy)
    .stroke();

  drawText(doc, {
    text: truncate(item.brochureName, 72),
    x: TABLE_X + 14,
    y: startY + 8,
    width: 420,
    font: 'Helvetica-Bold',
    size: 10.5,
    color: COLORS.white,
  });
  drawText(doc, {
    text: truncate(item.customerName ?? 'Unassigned customer', 62),
    x: TABLE_X + 450,
    y: startY + 9,
    width: TABLE_WIDTH - 464,
    size: 7.4,
    color: COLORS.infoMuted,
    align: 'right',
  });

  const detailY = startY + ITEM_HEADER_HEIGHT;
  drawCell({
    doc,
    x: TABLE_X,
    y: detailY,
    width: ITEM_INFO_WIDTH,
    height: ITEM_DETAIL_HEIGHT,
    fill: COLORS.white,
    stroke: COLORS.border,
  });
  drawReportImage(doc, imageBuffer, TABLE_X + 8, detailY + 8);
  drawText(doc, {
    text: item.brochureTypeName,
    x: TABLE_X + 102,
    y: detailY + 13,
    width: ITEM_INFO_WIDTH - 116,
    font: 'Helvetica-Bold',
    size: 8.5,
    color: COLORS.foreground,
  });
  drawText(doc, {
    text: `${formatNumber(item.unitsPerBox)} units per box`,
    x: TABLE_X + 102,
    y: detailY + 33,
    width: ITEM_INFO_WIDTH - 116,
    size: 7.4,
    color: COLORS.mutedForeground,
  });

  const metrics = [
    {
      label: 'Starting boxes',
      value: formatNumber(item.startingBalanceBoxes),
      color: COLORS.foreground,
    },
    {
      label: 'Net movement',
      value: formatMovement(item.netMovementBoxes),
      color: getMovementColor(item.netMovementBoxes),
    },
    {
      label: 'Ending boxes',
      value: formatNumber(item.endingBalanceBoxes),
      color: COLORS.navy,
    },
    {
      label: 'Ending units',
      value: formatNumber(item.endingBalanceUnits),
      color: COLORS.navy,
    },
  ] as const;
  const metricWidth = (TABLE_WIDTH - ITEM_INFO_WIDTH) / metrics.length;

  metrics.forEach((metric, index) => {
    const x = TABLE_X + ITEM_INFO_WIDTH + index * metricWidth;
    drawCell({
      doc,
      x,
      y: detailY,
      width: metricWidth,
      height: ITEM_DETAIL_HEIGHT,
      fill: index % 2 === 0 ? COLORS.secondary : COLORS.white,
      stroke: COLORS.border,
    });
    drawText(doc, {
      text: metric.label.toUpperCase(),
      x: x + 9,
      y: detailY + 17,
      width: metricWidth - 18,
      font: 'Helvetica-Bold',
      size: 6.5,
      color: COLORS.mutedForeground,
      align: 'right',
    });
    drawText(doc, {
      text: metric.value,
      x: x + 9,
      y: detailY + 33,
      width: metricWidth - 18,
      font: 'Helvetica-Bold',
      size: 10.5,
      color: metric.color,
      align: 'right',
    });
  });

  doc.y = detailY + ITEM_DETAIL_HEIGHT;

  return { startPageIndex, startY };
}

function drawItemContinuation(
  doc: PDFKit.PDFDocument,
  item: InventoryMonthlyReportResult['items'][number],
) {
  drawText(doc, {
    text: `${truncate(item.brochureName, 76)} continued`,
    x: MARGIN,
    y: doc.y,
    width: CONTENT_WIDTH,
    font: 'Helvetica-Bold',
    size: 8,
    color: COLORS.navy,
  });
  doc.y += 16;
}

function drawTransactionTableHeader(doc: PDFKit.PDFDocument) {
  const startY = doc.y;
  let x = TRANSACTION_TABLE_X;

  for (const column of TRANSACTION_COLUMNS) {
    drawCell({
      doc,
      x,
      y: startY,
      width: column.width,
      height: TRANSACTION_HEADER_HEIGHT,
      fill: COLORS.secondary,
      stroke: COLORS.border,
    });
    drawText(doc, {
      text: column.label,
      x: x + 8,
      y: startY + 7,
      width: column.width - 16,
      font: 'Helvetica-Bold',
      size: 7.3,
      color: COLORS.navy,
      align: column.align,
      height: 10,
      ellipsis: true,
    });
    x += column.width;
  }

  doc.y = startY + TRANSACTION_HEADER_HEIGHT;
}

function drawEmptyTableRow(doc: PDFKit.PDFDocument, message: string) {
  const y = doc.y;
  drawCell({
    doc,
    x: TRANSACTION_TABLE_X,
    y,
    width: TRANSACTION_TABLE_WIDTH,
    height: 42,
    fill: COLORS.muted,
    stroke: COLORS.border,
  });
  drawText(doc, {
    text: message,
    x: TRANSACTION_TABLE_X + 12,
    y: y + 14,
    width: TRANSACTION_TABLE_WIDTH - 24,
    size: 8,
    color: COLORS.mutedForeground,
    align: 'center',
  });
  doc.y = y + 42;
}

function drawTransactionsTable(
  doc: PDFKit.PDFDocument,
  item: InventoryMonthlyReportResult['items'][number],
) {
  ensureSpace(
    doc,
    TRANSACTION_TABLE_TOP_GAP +
      TRANSACTION_HEADER_HEIGHT +
      TRANSACTION_ROW_HEIGHT,
  );
  doc.y += TRANSACTION_TABLE_TOP_GAP;
  drawTransactionTableHeader(doc);

  if (item.transactions.length === 0) {
    drawEmptyTableRow(
      doc,
      'No transactions in this period. Starting and ending balance are unchanged.',
    );
    doc.y += ITEM_GROUP_GAP;
    return;
  }

  item.transactions.forEach((transaction, rowIndex) => {
    if (ensureSpace(doc, TRANSACTION_ROW_HEIGHT)) {
      drawItemContinuation(doc, item);
      drawTransactionTableHeader(doc);
    }

    const rowY = doc.y;
    const fill = rowIndex % 2 === 0 ? COLORS.white : COLORS.muted;
    const values = [
      formatShortDate(transaction.transactionDate),
      formatTransactionType(transaction.transactionType),
      formatMovement(transaction.movementBoxes),
      formatMovement(transaction.movementUnits),
      formatNumber(transaction.balanceBeforeBoxes),
      formatNumber(transaction.balanceAfterBoxes),
      transaction.notes ? truncate(transaction.notes, 48) : 'None',
    ];
    let x = TRANSACTION_TABLE_X;

    TRANSACTION_COLUMNS.forEach((column, index) => {
      drawCell({
        doc,
        x,
        y: rowY,
        width: column.width,
        height: TRANSACTION_ROW_HEIGHT,
        fill,
        stroke: COLORS.border,
      });
      drawText(doc, {
        text: values[index] ?? '',
        x: x + 8,
        y: rowY + 8,
        width: column.width - 16,
        font: index === 2 || index === 3 ? 'Helvetica-Bold' : 'Helvetica',
        size: 7.3,
        color:
          index === 2 || index === 3
            ? getMovementColor(
                index === 2
                  ? transaction.movementBoxes
                  : transaction.movementUnits,
              )
            : COLORS.foreground,
        align: column.align,
        height: TRANSACTION_ROW_HEIGHT - 12,
        lineBreak: false,
        ellipsis: true,
      });
      x += column.width;
    });

    doc.y = rowY + TRANSACTION_ROW_HEIGHT;
  });

  doc.y += ITEM_GROUP_GAP;
}

function drawEmptyReport(doc: PDFKit.PDFDocument) {
  ensureSpace(doc, 92);

  const y = doc.y;
  drawCell({
    doc,
    x: MARGIN,
    y,
    width: CONTENT_WIDTH,
    height: 76,
    fill: COLORS.secondary,
    stroke: COLORS.border,
  });
  doc.rect(MARGIN, y, 5, 76).fill(COLORS.accent);
  drawText(doc, {
    text: 'No inventory found for this warehouse.',
    x: MARGIN + 18,
    y: y + 19,
    width: CONTENT_WIDTH - 36,
    font: 'Helvetica-Bold',
    size: 12,
    color: COLORS.navy,
  });
  drawText(doc, {
    text: 'Choose another warehouse or period to generate a report.',
    x: MARGIN + 18,
    y: y + 41,
    width: CONTENT_WIDTH - 36,
    size: 8.5,
    color: COLORS.mutedForeground,
  });

  doc.y = y + 92;
}

function drawFooter(
  doc: PDFKit.PDFDocument,
  pageIndex: number,
  pageCount: number,
  report: InventoryMonthlyReportResult,
) {
  drawRule(doc, FOOTER_Y - 8);
  drawText(doc, {
    text: `Certified Travel Media | ${report.warehouse.name} | ${report.period.label}`,
    x: MARGIN,
    y: FOOTER_Y,
    width: CONTENT_WIDTH / 2,
    size: 7.2,
    color: COLORS.mutedForeground,
  });
  drawText(doc, {
    text: `Generated ${formatDateTime(new Date())} | Page ${pageIndex + 1} of ${pageCount}`,
    x: MARGIN + CONTENT_WIDTH / 2,
    y: FOOTER_Y,
    width: CONTENT_WIDTH / 2,
    size: 7.2,
    color: COLORS.mutedForeground,
    align: 'right',
  });
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
  const [imagesByItemId, logoBuffer] = await Promise.all([
    loadReportImages(report),
    loadLogoBuffer(),
  ]);

  drawHeader(doc, report, logoBuffer);
  drawSummary(doc, report);

  if (report.items.length === 0) {
    drawEmptyReport(doc);
  } else {
    const groupBoxes: PageGroupBox[] = [];

    for (const item of report.items) {
      const { startPageIndex, startY } = drawItemHeader(
        doc,
        item,
        imagesByItemId.get(item.id),
      );
      drawTransactionsTable(doc, item);

      const endY = doc.y - ITEM_GROUP_GAP;
      const endPageIndex = getCurrentPageIndex(doc);

      addPageSpanningGroupBoxes({
        boxes: groupBoxes,
        startPageIndex,
        startY,
        endPageIndex,
        endY,
        x: TABLE_X,
        width: TABLE_WIDTH,
      });
    }

    drawPageGroupBoxes(doc, groupBoxes);
  }

  const range = doc.bufferedPageRange();
  for (let index = 0; index < range.count; index++) {
    doc.switchToPage(index);
    drawFooter(doc, index, range.count, report);
  }

  return {
    buffer: await finalize(doc),
    filename: `inventory-report-${safeFilename(report.warehouse.name)}-${report.period.month}-${report.period.year}.pdf`,
  };
}
