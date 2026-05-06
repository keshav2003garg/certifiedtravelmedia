import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import PDFDocument from 'pdfkit';
import sharp from 'sharp';

import type {
  CustomerYearlyReportBrochure,
  CustomerYearlyReportResult,
  CustomerYearlyReportVariant,
} from '@/routes/admin/reports/reports.types';

const PAGE_WIDTH = 792;
const PAGE_HEIGHT = 612;
const MARGIN = 32;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const TABLE_X = MARGIN;
const TABLE_WIDTH = CONTENT_WIDTH;
const FOOTER_Y = PAGE_HEIGHT - 24;
const BROCHURE_IMAGE_WIDTH = 82;
const BROCHURE_IMAGE_HEIGHT = 54;
const BROCHURE_ROW_HEIGHT = 38;
const VARIANT_ROW_HEIGHT = 68;
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
} as const;

const LOGO_PATH_CANDIDATES = [
  resolve(process.cwd(), 'apps/admin/public/logo.png'),
  resolve(process.cwd(), 'apps/charts/public/logo.png'),
  resolve(process.cwd(), '../admin/public/logo.png'),
  resolve(process.cwd(), '../charts/public/logo.png'),
  resolve(process.cwd(), 'public/logo.png'),
] as const;

function finalize(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolveBuffer, reject) => {
    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolveBuffer(Buffer.concat(buffers)));
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
  if (doc.y + height <= PAGE_HEIGHT - MARGIN) return false;

  doc.addPage();
  doc.y = MARGIN;
  return true;
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
  },
) {
  const {
    align = 'left',
    color = COLORS.foreground,
    font = 'Helvetica',
    height,
    size = 8,
    text,
    width,
    x,
    y,
  } = params;

  doc.font(font).fontSize(size).fillColor(color).text(text, x, y, {
    align,
    height,
    lineBreak: true,
    width,
  });
}

function drawRule(doc: PDFKit.PDFDocument, y = doc.y) {
  doc
    .moveTo(MARGIN, y)
    .lineTo(PAGE_WIDTH - MARGIN, y)
    .strokeColor(COLORS.border)
    .lineWidth(0.7)
    .stroke();
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

async function normalizeBrochureImage(buffer: Buffer) {
  try {
    return await sharp(buffer)
      .rotate()
      .flatten({ background: COLORS.white })
      .resize(BROCHURE_IMAGE_WIDTH * 3, BROCHURE_IMAGE_HEIGHT * 3, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer();
  } catch {
    return buffer;
  }
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

function getVariantImageKey(variant: CustomerYearlyReportVariant) {
  return variant.brochureImageId;
}

async function loadReportImages(report: CustomerYearlyReportResult) {
  const imageUrls = new Map<string, string | null>();

  for (const brochure of report.brochures) {
    for (const variant of brochure.variants) {
      const key = getVariantImageKey(variant);
      if (!imageUrls.has(key)) imageUrls.set(key, variant.imageUrl);
    }
  }

  const entries = Array.from(imageUrls.entries());
  const images = new Map<string, Buffer | null>();
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < entries.length) {
      const index = nextIndex;
      nextIndex += 1;

      const entry = entries[index];
      if (!entry) continue;

      const [key, imageUrl] = entry;
      const buffer = await fetchImageBuffer(imageUrl);
      images.set(key, buffer ? await normalizeBrochureImage(buffer) : null);
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
  width = BROCHURE_IMAGE_WIDTH,
  height = BROCHURE_IMAGE_HEIGHT,
) {
  drawCell({ doc, x, y, width, height, fill: COLORS.white });
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
  width = BROCHURE_IMAGE_WIDTH,
  height = BROCHURE_IMAGE_HEIGHT,
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

function drawHeader(
  doc: PDFKit.PDFDocument,
  report: CustomerYearlyReportResult,
  logoBuffer: Buffer | null,
) {
  doc.rect(0, 0, PAGE_WIDTH, 9).fill(COLORS.primary);
  doc.rect(0, 9, PAGE_WIDTH, 2.5).fill(COLORS.accent);

  drawLogo(doc, logoBuffer, 22);

  drawText(doc, {
    text: 'Year-End Report',
    x: MARGIN,
    y: 106,
    width: CONTENT_WIDTH,
    align: 'center',
    font: 'Helvetica-Bold',
    size: 20,
    color: COLORS.navy,
  });
  drawText(doc, {
    text: 'Customer distribution activity summary',
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
      label: 'Customer',
      value: report.customer.name,
      width: 280,
    },
    {
      label: 'Customer ID',
      value: report.customer.acumaticaId || 'N/A',
      width: 126,
    },
    {
      label: 'Report Year',
      value: String(report.period.year),
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
  report: CustomerYearlyReportResult,
) {
  const columns = [
    ['Brochures', formatNumber(report.summary.brochureCount)],
    ['Image / pack rows', formatNumber(report.summary.variantCount)],
    ['Distributed boxes', formatNumber(report.summary.distributionBoxes)],
    ['Distributed units', formatNumber(report.summary.distributionUnits)],
  ] as const;
  const cellWidth = CONTENT_WIDTH / columns.length;
  const startY = doc.y;

  doc.rect(MARGIN, startY, CONTENT_WIDTH, 4).fill(COLORS.accent);

  columns.forEach(([label, value], index) => {
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
      text: label.toUpperCase(),
      x: x + 9,
      y: startY + 14,
      width: cellWidth - 18,
      font: 'Helvetica-Bold',
      size: 6.6,
      color: COLORS.mutedForeground,
    });
    drawText(doc, {
      text: value,
      x: x + 9,
      y: startY + 29,
      width: cellWidth - 18,
      font: 'Helvetica-Bold',
      size: 12,
      color: COLORS.navy,
    });
  });

  doc.y = startY + 68;
}

function drawBrochureHeader(
  doc: PDFKit.PDFDocument,
  brochure: CustomerYearlyReportBrochure,
) {
  const startY = doc.y;
  drawCell({
    doc,
    x: TABLE_X,
    y: startY,
    width: TABLE_WIDTH,
    height: BROCHURE_ROW_HEIGHT,
    fill: COLORS.secondary,
    stroke: COLORS.border,
  });
  doc.rect(TABLE_X, startY, 4, BROCHURE_ROW_HEIGHT).fill(COLORS.primary);

  drawText(doc, {
    text: truncate(brochure.name, 72),
    x: TABLE_X + 12,
    y: startY + 8,
    width: 390,
    font: 'Helvetica-Bold',
    size: 9.4,
    color: COLORS.navy,
  });
  drawText(doc, {
    text: `${brochure.brochureTypeName} | ${formatNumber(brochure.variants.length)} image/pack ${brochure.variants.length === 1 ? 'row' : 'rows'}`,
    x: TABLE_X + 12,
    y: startY + 22,
    width: 390,
    size: 7.2,
    color: COLORS.mutedForeground,
  });

  const values = [
    [`${formatNumber(brochure.distributionBoxes)} boxes`, 140],
    [`${formatNumber(brochure.distributionUnits)} units`, 148],
  ] as const;
  let x = TABLE_X + TABLE_WIDTH;

  for (const [value, width] of [...values].reverse()) {
    x -= width;
    drawText(doc, {
      text: value,
      x,
      y: startY + 14,
      width: width - 12,
      font: 'Helvetica-Bold',
      size: 8.4,
      color: COLORS.foreground,
      align: 'right',
    });
  }

  doc.y = startY + BROCHURE_ROW_HEIGHT;
}

function drawVariantRow(params: {
  doc: PDFKit.PDFDocument;
  variant: CustomerYearlyReportVariant;
  imageBuffer: Buffer | null | undefined;
}) {
  const { doc, imageBuffer, variant } = params;
  ensureSpace(doc, VARIANT_ROW_HEIGHT);

  const startY = doc.y;
  const rowX = TABLE_X + 16;
  const rowWidth = TABLE_WIDTH - 16;
  drawCell({
    doc,
    x: rowX,
    y: startY,
    width: rowWidth,
    height: VARIANT_ROW_HEIGHT,
    fill: COLORS.white,
    stroke: COLORS.border,
  });
  drawReportImage(doc, imageBuffer, rowX + 8, startY + 7);

  drawText(doc, {
    text: 'PACK ID',
    x: rowX + 104,
    y: startY + 10,
    width: 292,
    font: 'Helvetica-Bold',
    size: 6.5,
    color: COLORS.mutedForeground,
  });
  drawText(doc, {
    text: variant.brochureImagePackSizeId,
    x: rowX + 104,
    y: startY + 22,
    width: 292,
    font: 'Helvetica-Bold',
    size: 6.8,
    color: COLORS.foreground,
  });
  drawText(doc, {
    text: 'UNIT PER BOX',
    x: rowX + 104,
    y: startY + 41,
    width: 292,
    font: 'Helvetica-Bold',
    size: 6.5,
    color: COLORS.mutedForeground,
  });
  drawText(doc, {
    text: `${formatNumber(variant.unitsPerBox)} units per box`,
    x: rowX + 104,
    y: startY + 52,
    width: 292,
    font: 'Helvetica-Bold',
    size: 8.2,
    color: COLORS.foreground,
  });

  const values = [
    ['Distributed boxes', formatNumber(variant.distributionBoxes), 144],
    ['Distributed units', formatNumber(variant.distributionUnits), 152],
  ] as const;
  let x = rowX + rowWidth;

  for (const [label, value, width] of [...values].reverse()) {
    x -= width;
    drawText(doc, {
      text: label.toUpperCase(),
      x,
      y: startY + 16,
      width: width - 14,
      font: 'Helvetica-Bold',
      size: 6.4,
      color: COLORS.mutedForeground,
      align: 'right',
    });
    drawText(doc, {
      text: value,
      x,
      y: startY + 32,
      width: width - 14,
      font: 'Helvetica-Bold',
      size: 9,
      color: COLORS.foreground,
      align: 'right',
    });
  }

  doc.y = startY + VARIANT_ROW_HEIGHT;
}

function drawEmptyTableRow(doc: PDFKit.PDFDocument, message: string) {
  const y = doc.y;
  drawCell({
    doc,
    x: TABLE_X,
    y,
    width: TABLE_WIDTH,
    height: 42,
    fill: COLORS.muted,
    stroke: COLORS.border,
  });
  drawText(doc, {
    text: message,
    x: TABLE_X + 12,
    y: y + 14,
    width: TABLE_WIDTH - 24,
    size: 8,
    color: COLORS.mutedForeground,
    align: 'center',
  });
  doc.y = y + 42;
}

function drawBrochure(params: {
  doc: PDFKit.PDFDocument;
  brochure: CustomerYearlyReportBrochure;
  images: Map<string, Buffer | null>;
}) {
  const { brochure, doc, images } = params;
  ensureSpace(
    doc,
    BROCHURE_ROW_HEIGHT +
      (brochure.variants.length > 0 ? VARIANT_ROW_HEIGHT : 0),
  );
  drawBrochureHeader(doc, brochure);

  if (brochure.variants.length === 0) {
    drawEmptyTableRow(
      doc,
      'No image and unit-per-box details are available for this brochure.',
    );
    doc.y += 10;
    return;
  }

  for (const variant of brochure.variants) {
    drawVariantRow({
      doc,
      variant,
      imageBuffer: images.get(getVariantImageKey(variant)),
    });
  }

  doc.y += 10;
}

function drawEmptyReport(
  doc: PDFKit.PDFDocument,
  report: CustomerYearlyReportResult,
) {
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
    text: 'No distributions found for this customer in this year.',
    x: MARGIN + 18,
    y: y + 19,
    width: CONTENT_WIDTH - 36,
    font: 'Helvetica-Bold',
    size: 12,
    color: COLORS.navy,
  });
  drawText(doc, {
    text: `${report.customer.name} has no distributions between ${formatOrdinalDate(report.period.startDate)} and ${formatOrdinalDate(report.period.endDate)}.`,
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
  report: CustomerYearlyReportResult,
) {
  drawRule(doc, FOOTER_Y - 8);
  drawText(doc, {
    text: `Certified Travel Media | ${report.customer.name} | ${report.period.year}`,
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

export async function generateCustomerYearlyReportPDF(
  report: CustomerYearlyReportResult,
) {
  const doc = new PDFDocument({
    size: 'LETTER',
    layout: 'landscape',
    margin: MARGIN,
    bufferPages: true,
    info: {
      Title: `Customer Year-End Report - ${report.customer.name} - ${report.period.year}`,
      Author: 'Certified Travel Media',
    },
  });
  const [logoBuffer, brochureImages] = await Promise.all([
    loadLogoBuffer(),
    loadReportImages(report),
  ]);

  drawHeader(doc, report, logoBuffer);
  drawSummary(doc, report);

  if (report.summary.distributionUnits === 0 || report.brochures.length === 0) {
    drawEmptyReport(doc, report);
  } else {
    for (const brochure of report.brochures) {
      drawBrochure({ doc, brochure, images: brochureImages });
    }
  }

  const range = doc.bufferedPageRange();
  for (let index = 0; index < range.count; index++) {
    doc.switchToPage(index);
    drawFooter(doc, index, range.count, report);
  }

  return {
    buffer: await finalize(doc),
    filename: `customer-year-end-report-${safeFilename(report.customer.name)}-${report.period.year}.pdf`,
  };
}
