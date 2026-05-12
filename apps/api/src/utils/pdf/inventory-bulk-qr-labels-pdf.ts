import PDFDocument from 'pdfkit';
import sharp from 'sharp';

const POINTS_PER_INCH = 72;
const PAGE_WIDTH = 8.5 * POINTS_PER_INCH;
const PAGE_HEIGHT = 11 * POINTS_PER_INCH;
const LABEL_WIDTH = 4 * POINTS_PER_INCH;
const LABEL_HEIGHT = 2.5 * POINTS_PER_INCH;
const LABEL_COLUMNS = 2;
const LABEL_ROWS = 4;
const LABELS_PER_PAGE = LABEL_COLUMNS * LABEL_ROWS;
const MARGIN_X = (PAGE_WIDTH - LABEL_COLUMNS * LABEL_WIDTH) / 2;
const MARGIN_Y = (PAGE_HEIGHT - LABEL_ROWS * LABEL_HEIGHT) / 2;
const LABEL_PADDING = 8;
const PHOTO_WIDTH = 1.1 * POINTS_PER_INCH;
const QR_SIZE = 1.5 * POINTS_PER_INCH;
const NAME_WIDTH = LABEL_WIDTH - PHOTO_WIDTH - QR_SIZE - LABEL_PADDING * 4;
const IMAGE_TIMEOUT_MS = 5000;
const PHOTO_FETCH_CONCURRENCY = 12;
const QR_FETCH_CONCURRENCY = 24;
const PHOTO_PIXEL_WIDTH = 170;
const PHOTO_PIXEL_HEIGHT = 350;
const QR_PIXEL_SIZE = 250;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const LOGO_URL = 'https://certifiedtravelmedia.net/logo.png';
const LOGO_DISPLAY_SIZE = 22;

export interface InventoryBulkQrLabelPdfItem {
  brochureName: string;
  qrCodeUrl: string;
  coverPhotoUrl: string | null;
  boxes: number;
  unitsPerBox: number;
}

interface InventoryBulkQrLabelsPdfInput {
  items: InventoryBulkQrLabelPdfItem[];
}

interface ImageTransformOptions {
  width: number;
  height: number;
  format: 'jpeg' | 'png';
}

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
    return isBase64
      ? Buffer.from(payload, 'base64')
      : Buffer.from(decodeURIComponent(payload), 'utf8');
  } catch {
    return null;
  }
}

function isImageSource(value: string) {
  return isHttpImageUrl(value) || parseDataImageBuffer(value) !== null;
}

async function loadLogoBuffer() {
  return fetchImageBuffer(LOGO_URL);
}

async function fetchImageBuffer(url: string) {
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

async function compressImage(
  buffer: Buffer,
  { width, height, format }: ImageTransformOptions,
) {
  try {
    const pipeline = sharp(buffer)
      .rotate()
      .resize(width, height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      });

    if (format === 'jpeg') {
      return pipeline.jpeg({ quality: 70, mozjpeg: true }).toBuffer();
    }

    return pipeline.png({ compressionLevel: 9 }).toBuffer();
  } catch {
    return buffer;
  }
}

async function loadImageCache(
  urls: string[],
  concurrency: number,
  transform: ImageTransformOptions,
) {
  const uniqueUrls = Array.from(new Set(urls.filter(isImageSource)));
  const cache = new Map<string, Buffer>();
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < uniqueUrls.length) {
      const index = nextIndex;
      nextIndex += 1;

      const url = uniqueUrls[index];
      if (!url) continue;

      const buffer = await fetchImageBuffer(url);
      if (buffer) cache.set(url, await compressImage(buffer, transform));
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, uniqueUrls.length) }, () =>
      worker(),
    ),
  );

  return cache;
}

function drawImagePlaceholder(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
) {
  doc
    .roundedRect(x, y, width, height, 3)
    .fillAndStroke('#f9fafb', '#d1d5db')
    .font('Helvetica')
    .fontSize(7)
    .fillColor('#6b7280')
    .text(label, x + 4, y + height / 2 - 4, {
      width: width - 8,
      align: 'center',
    });
}

function drawImage(
  doc: PDFKit.PDFDocument,
  buffer: Buffer | null | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
  fallbackLabel: string,
) {
  if (!buffer) {
    drawImagePlaceholder(doc, x, y, width, height, fallbackLabel);
    return;
  }

  try {
    doc.image(buffer, x, y, {
      fit: [width, height],
      align: 'center',
      valign: 'center',
    });
  } catch {
    drawImagePlaceholder(doc, x, y, width, height, fallbackLabel);
  }
}

function drawLabelText(
  doc: PDFKit.PDFDocument,
  item: InventoryBulkQrLabelPdfItem,
  x: number,
  y: number,
) {
  const nameAreaHeight = LABEL_HEIGHT - LABEL_PADDING * 2;
  const details = `${formatNumber(item.unitsPerBox)} units/box`;

  doc.font('Helvetica-Bold').fontSize(8);
  const nameHeight = doc.heightOfString(item.brochureName, {
    width: NAME_WIDTH,
    lineBreak: true,
  });
  doc.font('Helvetica').fontSize(7);
  const detailsHeight = doc.heightOfString(details, {
    width: NAME_WIDTH,
    lineBreak: true,
  });

  const gap = 3;
  const totalHeight = nameHeight + gap + detailsHeight;
  let currentY = y + LABEL_PADDING + (nameAreaHeight - totalHeight) / 2;

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor('#111827')
    .text(item.brochureName, x, currentY, {
      width: NAME_WIDTH,
      align: 'center',
      lineBreak: true,
    });
  currentY += nameHeight + gap;

  doc
    .font('Helvetica')
    .fontSize(7)
    .fillColor('#4b5563')
    .text(details, x, currentY, {
      width: NAME_WIDTH,
      align: 'center',
      lineBreak: true,
    });
}

function drawLabel(
  doc: PDFKit.PDFDocument,
  item: InventoryBulkQrLabelPdfItem,
  labelX: number,
  labelY: number,
  photoCache: Map<string, Buffer>,
  qrCache: Map<string, Buffer>,
) {
  const photoX = labelX + LABEL_PADDING;
  const imageHeight = LABEL_HEIGHT - LABEL_PADDING * 2;
  const photoBuffer = item.coverPhotoUrl
    ? photoCache.get(item.coverPhotoUrl)
    : null;

  drawImage(
    doc,
    photoBuffer,
    photoX,
    labelY + LABEL_PADDING,
    PHOTO_WIDTH,
    imageHeight,
    'No image',
  );

  const nameX = labelX + LABEL_PADDING + PHOTO_WIDTH + LABEL_PADDING;
  drawLabelText(doc, item, nameX, labelY);

  const qrX = labelX + LABEL_WIDTH - QR_SIZE - LABEL_PADDING;
  const qrY = labelY + (LABEL_HEIGHT - QR_SIZE) / 2;
  drawImage(
    doc,
    qrCache.get(item.qrCodeUrl),
    qrX,
    qrY,
    QR_SIZE,
    QR_SIZE,
    'QR unavailable',
  );
}

export async function generateInventoryBulkQrLabelsPDF({
  items,
}: InventoryBulkQrLabelsPdfInput) {
  const [qrCache, photoCache, logoBuffer] = await Promise.all([
    loadImageCache(
      items.map((item) => item.qrCodeUrl),
      QR_FETCH_CONCURRENCY,
      { width: QR_PIXEL_SIZE, height: QR_PIXEL_SIZE, format: 'png' },
    ),
    loadImageCache(
      items
        .map((item) => item.coverPhotoUrl)
        .filter((url): url is string => Boolean(url)),
      PHOTO_FETCH_CONCURRENCY,
      {
        width: PHOTO_PIXEL_WIDTH,
        height: PHOTO_PIXEL_HEIGHT,
        format: 'jpeg',
      },
    ),
    loadLogoBuffer(),
  ]);

  const doc = new PDFDocument({
    size: 'LETTER',
    layout: 'portrait',
    margin: 0,
    bufferPages: true,
    info: {
      Title: 'Inventory Bulk QR Labels',
      Author: 'Certified Travel Media',
    },
  });

  items.forEach((item, index) => {
    const pagePosition = index % LABELS_PER_PAGE;

    if (index > 0 && pagePosition === 0) {
      doc.addPage();
    }

    const column = pagePosition % LABEL_COLUMNS;
    const row = Math.floor(pagePosition / LABEL_COLUMNS);
    const labelX = MARGIN_X + column * LABEL_WIDTH;
    const labelY = MARGIN_Y + row * LABEL_HEIGHT;

    drawLabel(doc, item, labelX, labelY, photoCache, qrCache);
  });

  const range = doc.bufferedPageRange();
  for (let index = 0; index < range.count; index++) {
    doc.switchToPage(index);
    if (logoBuffer) {
      try {
        doc.image(
          logoBuffer,
          (PAGE_WIDTH - LOGO_DISPLAY_SIZE) / 2,
          (MARGIN_Y - LOGO_DISPLAY_SIZE) / 2,
          {
            width: LOGO_DISPLAY_SIZE,
            height: LOGO_DISPLAY_SIZE,
          },
        );
      } catch {
        // ignore logo render errors
      }
    }
  }

  const generatedDate = new Date().toISOString().slice(0, 10);

  return {
    buffer: await finalize(doc),
    filename: `inventory-bulk-qr-labels-${safeFilename(generatedDate)}.pdf`,
  };
}
