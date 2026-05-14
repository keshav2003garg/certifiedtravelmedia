import PDFDocument from 'pdfkit';

import type { ChartResult } from '@/routes/public/charts/charts.types';

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

interface ChartPDFInput {
  chart: ChartResult;
  sectorLabel: string;
}

interface ChartsPDFInput {
  charts: ChartResult[];
  sectorLabel: string;
  title: string;
  filename: string;
}

interface CellData {
  label: string;
  colSpan: number;
  tileType: 'Paid' | 'Filler' | 'Removal';
  isFlagged: boolean;
  flagNote: string | null;
  isNew: boolean;
  tier: string | null;
  contractEndDate: string | null;
}

interface FooterSection {
  label: string;
  lines: string[];
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

function getMonthDateRange(month: number, year: number) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    firstDayStr: `${year}-${pad(month)}-${pad(firstDay.getDate())}`,
    lastDayStr: `${year}-${pad(month)}-${pad(lastDay.getDate())}`,
  };
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${MONTH_NAMES[parseInt(m!, 10) - 1]} ${String(parseInt(d!, 10)).padStart(2, '0')}, ${y}`;
}

function getChartPageLayout(chart: ChartResult) {
  return chart.location.pockets.width > 6 ? 'landscape' : 'portrait';
}

function getReadableLabel(value: string | null | undefined, fallback: string) {
  const label = value?.trim();
  return label && label.length > 0 ? label : fallback;
}

function getFontSizeForWidth(
  doc: PDFKit.PDFDocument,
  text: string,
  width: number,
  maxSize: number,
  minSize: number,
) {
  let fontSize = maxSize;

  while (fontSize > minSize) {
    doc.fontSize(fontSize);
    if (doc.widthOfString(text) <= width) return fontSize;
    fontSize -= 0.25;
  }

  return minSize;
}

function drawRemovalInstruction(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  brochureName: string | null | undefined,
) {
  const label = 'REMOVE:';
  const name = getReadableLabel(brochureName, 'Brochure to remove');

  doc.save();

  doc.font('Helvetica-Bold').fontSize(4.8);
  const labelWidth = Math.min(doc.widthOfString(label) + 2, width * 0.4);
  const nameX = x + labelWidth + 1;
  const nameWidth = Math.max(width - labelWidth - 1, width * 0.5);
  const nameFontSize = getFontSizeForWidth(doc, name, nameWidth, 4.8, 3.2);

  doc.font('Helvetica-Bold').fontSize(4.8).fillColor('#DC2626');
  doc.text(label, x, y, { width: labelWidth, lineBreak: false });
  doc.font('Helvetica-Bold').fontSize(nameFontSize).fillColor('#DC2626');
  doc.text(name, nameX, y, { width: nameWidth, lineBreak: false });
  doc.restore();
}

function createChartPDFDocument(chart: ChartResult, title: string) {
  return new PDFDocument({
    size: 'LETTER',
    layout: getChartPageLayout(chart),
    margin: 30,
    bufferPages: true,
    info: {
      Title: title,
      Author: 'CTM Media',
    },
  });
}

function drawFlagIcon(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  color: string,
) {
  doc.save();
  doc
    .moveTo(x, y)
    .lineTo(x, y + 8)
    .strokeColor(color)
    .lineWidth(0.8)
    .stroke();
  doc
    .moveTo(x + 1, y)
    .lineTo(x + 8, y + 2)
    .lineTo(x + 1, y + 4)
    .closePath()
    .fillColor(color)
    .fill();
  doc.restore();
}

function drawChartPDFPage(
  doc: PDFKit.PDFDocument,
  { chart, sectorLabel }: ChartPDFInput,
) {
  const { month, year } = chart;
  const gridW = chart.location.pockets.width;
  const gridH = chart.location.pockets.height;

  const grid: (CellData | null)[][] = Array.from({ length: gridH }, () =>
    Array.from({ length: gridW }, () => null),
  );
  const occupied = new Set<string>();
  const removalOverlays = new Map<string, (typeof chart.removals)[number]>();

  for (const tile of chart.tiles) {
    if (tile.row < gridH && tile.col < gridW) {
      grid[tile.row]![tile.col] = {
        label: tile.label || '',
        colSpan: tile.colSpan,
        tileType: tile.tileType,
        isFlagged: tile.isFlagged,
        flagNote: tile.flagNote,
        isNew: tile.isNew,
        tier: tile.tier,
        contractEndDate: tile.contractEndDate,
      };
      for (let c = 1; c < tile.colSpan; c++) {
        occupied.add(`${tile.row},${tile.col + c}`);
      }
    }
  }

  for (const removal of chart.removals) {
    const r = removal.position.row;
    const c = removal.position.col;
    if (r >= gridH || c >= gridW) continue;

    const overlappingTiles = chart.tiles.filter(
      (tile) =>
        tile.row === r &&
        tile.col < c + removal.size.cols &&
        c < tile.col + tile.colSpan,
    );

    if (overlappingTiles.length > 0) {
      for (const tile of overlappingTiles) {
        removalOverlays.set(`${tile.row},${tile.col}`, removal);
      }
      continue;
    }

    grid[r]![c] = {
      label: removal.brochureName,
      colSpan: removal.size.cols,
      tileType: 'Removal',
      isFlagged: false,
      flagNote: null,
      isNew: false,
      tier: null,
      contractEndDate: removal.expiredDate,
    };
    for (let cc = 1; cc < removal.size.cols; cc++) {
      occupied.add(`${r},${c + cc}`);
    }
  }

  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const margin = 30;
  const contentW = pageW - margin * 2;

  // ── Title ──
  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .fillColor('#000000')
    .text('CTM Fill Chart', margin, margin, {
      align: 'center',
      width: contentW,
    });
  doc.moveDown(0.3);

  // ── Header info ──
  const headerY = doc.y;
  const { firstDayStr, lastDayStr } = getMonthDateRange(month, year);
  const startDateFormatted = formatDate(firstDayStr);
  const endDateFormatted = formatDate(lastDayStr);

  doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
  doc
    .text(`Chart:`, margin, headerY, { continued: true })
    .font('Helvetica')
    .text(`   ${chart.location.name}`);
  doc
    .font('Helvetica-Bold')
    .text(`Sector:`, margin, headerY + 13, { continued: true })
    .font('Helvetica')
    .text(`   ${sectorLabel || '—'}`);

  doc
    .font('Helvetica-Bold')
    .text(`Start date:`, margin + contentW - 200, headerY, { continued: true })
    .font('Helvetica')
    .text(`   ${startDateFormatted}`);
  doc
    .font('Helvetica-Bold')
    .text(`End date:`, margin + contentW - 200, headerY + 13, {
      continued: true,
    })
    .font('Helvetica')
    .text(`   ${endDateFormatted}`);

  doc.y = headerY + 30;

  // ── Grid ──
  const gridStartY = doc.y + 5;
  const colHeaderH = 12;
  const rowHeaderW = 25;
  const cellW = Math.floor((contentW - rowHeaderW) / gridW);
  const cellH = 28;
  const gridTotalW = rowHeaderW + cellW * gridW;
  const gridStartX = margin;

  // Column headers (A, B, C, ...)
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000');
  for (let c = 0; c < gridW; c++) {
    const x = gridStartX + rowHeaderW + c * cellW;
    doc.text(String.fromCharCode(65 + c), x, gridStartY + 4, {
      width: cellW,
      align: 'center',
    });
  }

  // Horizontal line under column headers
  const colHeaderBottom = gridStartY + colHeaderH;
  doc
    .moveTo(gridStartX, colHeaderBottom)
    .lineTo(gridStartX + gridTotalW, colHeaderBottom)
    .strokeColor('#000000')
    .lineWidth(1)
    .stroke();

  // Draw grid rows
  for (let r = 0; r < gridH; r++) {
    const rowY = colHeaderBottom + r * cellH;

    if (rowY + cellH > pageH - margin - 60) {
      doc.addPage();
    }

    // Row number
    doc.fontSize(7).font('Helvetica').fillColor('#000000');
    doc.text(String(r + 1), gridStartX, rowY + cellH / 2 - 3, {
      width: rowHeaderW,
      align: 'center',
    });

    // Draw cells
    for (let c = 0; c < gridW; c++) {
      if (occupied.has(`${r},${c}`)) continue;

      const cell = grid[r]![c];
      const removalOverlay = removalOverlays.get(`${r},${c}`);
      const x = gridStartX + rowHeaderW + c * cellW;
      const w = cell ? cellW * cell.colSpan : cellW;

      doc
        .rect(x, rowY, w, cellH)
        .strokeColor('#999999')
        .lineWidth(0.5)
        .stroke();

      if (!cell) continue;

      let bgColor: string | null = null;
      if (cell.tileType === 'Removal') {
        bgColor = '#FEE2E2';
      } else if (cell.tileType === 'Paid') {
        if (cell.isNew) {
          bgColor = '#22C55E';
        } else if (cell.tier === 'Premium Placement') {
          bgColor = '#F59E0B';
        } else {
          bgColor = '#3B82F6';
        }
      } else if (cell.tileType === 'Filler') {
        bgColor = '#E5E7EB';
      }

      if (bgColor) {
        doc
          .rect(x + 0.5, rowY + 0.5, w - 1, cellH - 1)
          .fillColor(bgColor)
          .fill();
      }

      const textColor = cell.tileType === 'Paid' ? '#FFFFFF' : '#000000';
      const textX = x + 3;
      const textW = w - 6;
      const hasRemovalMarker =
        cell.tileType === 'Removal' || Boolean(removalOverlay);

      doc.fontSize(6).font('Helvetica-Bold').fillColor(textColor);
      doc.text(cell.label, textX, rowY + 4, {
        width: textW,
        height: hasRemovalMarker ? cellH - 16 : cellH - 12,
        lineBreak: true,
        ellipsis: false,
      });

      if (cell.isFlagged) {
        drawFlagIcon(doc, x + w - 12, rowY + cellH - 11, textColor);
      } else if (cell.tileType === 'Removal') {
        drawRemovalInstruction(doc, textX, rowY + cellH - 9, textW, cell.label);
      }

      if (removalOverlay && cell.tileType !== 'Removal') {
        doc
          .save()
          .dash(2, { space: 1.5 })
          .rect(x + 1, rowY + 1, w - 2, cellH - 2)
          .strokeColor('#DC2626')
          .lineWidth(1)
          .stroke()
          .undash()
          .restore();
        drawRemovalInstruction(
          doc,
          textX,
          rowY + cellH - 9,
          textW,
          removalOverlay.brochureName,
        );
      }
    }

    // Row bottom border
    doc
      .moveTo(gridStartX, rowY + cellH)
      .lineTo(gridStartX + gridTotalW, rowY + cellH)
      .strokeColor('#999999')
      .lineWidth(0.5)
      .stroke();
  }

  // Left border of grid
  doc
    .moveTo(gridStartX + rowHeaderW, colHeaderBottom)
    .lineTo(gridStartX + rowHeaderW, colHeaderBottom + gridH * cellH)
    .strokeColor('#000000')
    .lineWidth(0.5)
    .stroke();

  // ── Driver Notes ──
  const footerSections: FooterSection[] = [];
  const newTiles = chart.tiles.filter((t) => t.isNew && t.tileType === 'Paid');
  const flaggedTiles = chart.tiles.filter((t) => t.isFlagged);

  if (newTiles.length > 0) {
    footerSections.push({
      label: 'PLACE',
      lines: newTiles.map((tile) =>
        getReadableLabel(tile.label, 'New placement'),
      ),
    });
  }

  if (chart.removals.length > 0) {
    footerSections.push({
      label: 'REMOVE',
      lines: chart.removals.map((removal) =>
        getReadableLabel(removal.brochureName, 'Brochure to remove'),
      ),
    });
  }

  if (flaggedTiles.length > 0) {
    footerSections.push({
      label: 'FLAGS',
      lines: flaggedTiles.map((tile) => {
        const label = getReadableLabel(tile.label, 'Flagged tile');
        return `${label}: ${tile.flagNote || 'Flagged'}`;
      }),
    });
  }

  if (chart.generalNotes) {
    footerSections.push({
      label: 'NOTES',
      lines: [chart.generalNotes],
    });
  }

  let footerY = colHeaderBottom + gridH * cellH + 15;
  const footerLabelW = 66;
  const footerGap = 10;
  const footerTextX = margin + footerLabelW + footerGap;
  const footerTextW = contentW - footerLabelW - footerGap;

  const addFooterPage = () => {
    doc.addPage({ layout: getChartPageLayout(chart) });
    footerY = margin;
  };

  const ensureFooterSpace = (height: number) => {
    if (footerY + height > doc.page.height - margin) {
      addFooterPage();
    }
  };

  if (footerSections.length > 0) {
    ensureFooterSpace(16);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
    doc.text('Driver notes:', margin, footerY, { width: contentW });
    footerY += 15;

    for (const section of footerSections) {
      const sectionText = section.lines.join('\n');
      doc.fontSize(8).font('Helvetica');
      const textHeight = doc.heightOfString(sectionText, {
        width: footerTextW,
        lineGap: 2,
      });
      const sectionHeight = Math.max(11, textHeight) + 7;

      ensureFooterSpace(sectionHeight);
      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(section.label === 'REMOVE' ? '#DC2626' : '#000000')
        .text(`${section.label}:`, margin, footerY, {
          width: footerLabelW,
          align: 'right',
        });
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#000000')
        .text(sectionText, footerTextX, footerY, {
          width: footerTextW,
          lineGap: 2,
        });
      footerY += sectionHeight;
    }
  }

  // ── Legend ──
  const legend = [
    { color: '#22C55E', label: 'New Client' },
    { color: '#F59E0B', label: 'Premium Placement' },
    { color: '#3B82F6', label: 'Normal Placement' },
    { color: '#FB2C36', label: 'To Remove' },
  ];
  const swatchSize = 10;
  const legendItemW = 130;
  const legendTotalW = legend.length * legendItemW;
  let legendX = margin + (contentW - legendTotalW) / 2;
  ensureFooterSpace(24);
  footerY += 4;

  for (const item of legend) {
    doc
      .rect(legendX, footerY, swatchSize, swatchSize)
      .fillColor(item.color)
      .fill();
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#000000')
      .text(item.label, legendX + swatchSize + 4, footerY + 1, {
        width: legendItemW - swatchSize - 4,
      });
    legendX += legendItemW;
  }
  footerY += 20;

  // Print date (bottom-right)
  ensureFooterSpace(12);
  doc.fontSize(8).font('Helvetica').fillColor('#000000');
  doc.text(
    `Print date: ${formatDate(new Date().toISOString().split('T')[0]!)}`,
    margin,
    footerY,
    { align: 'right', width: contentW },
  );
}

export async function generateChartPDF({ chart, sectorLabel }: ChartPDFInput) {
  const doc = createChartPDFDocument(
    chart,
    `CTM Fill Chart - ${chart.location.name}`,
  );

  drawChartPDFPage(doc, { chart, sectorLabel });

  const buffer = await finalize(doc);

  return {
    buffer,
    filename: `fill-chart-${chart.location.name.replace(/[^a-zA-Z0-9-_]/g, '_')}-${MONTH_NAMES[chart.month - 1]}-${chart.year}.pdf`,
  };
}

export async function generateChartsPDF({
  charts,
  sectorLabel,
  title,
  filename,
}: ChartsPDFInput) {
  const firstChart = charts[0];

  if (!firstChart) {
    throw new Error('At least one chart is required to generate a PDF');
  }

  const doc = createChartPDFDocument(firstChart, title);

  charts.forEach((chart, index) => {
    if (index > 0) {
      doc.addPage({ layout: getChartPageLayout(chart) });
    }

    drawChartPDFPage(doc, { chart, sectorLabel });
  });

  return {
    buffer: await finalize(doc),
    filename,
  };
}
