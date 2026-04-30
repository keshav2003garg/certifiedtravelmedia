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

export async function generateChartPDF({ chart, sectorLabel }: ChartPDFInput) {
  const { month, year } = chart;
  const gridW = chart.location.pockets.width;
  const gridH = chart.location.pockets.height;

  const grid: (CellData | null)[][] = Array.from({ length: gridH }, () =>
    Array.from({ length: gridW }, () => null),
  );
  const occupied = new Set<string>();

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
    if (r < gridH && c < gridW) {
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
  }

  const isLandscape = gridW > 6;
  const doc = new PDFDocument({
    size: 'LETTER',
    layout: isLandscape ? 'landscape' : 'portrait',
    margin: 30,
    bufferPages: true,
    info: {
      Title: `CTM Fill Chart - ${chart.location.name}`,
      Author: 'CTM Media',
    },
  });

  const pageW = isLandscape ? 792 : 612;
  const pageH = isLandscape ? 612 : 792;
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
      const x = gridStartX + rowHeaderW + c * cellW;
      const w = cell ? cellW * cell.colSpan : cellW;

      doc
        .rect(x, rowY, w, cellH)
        .strokeColor('#999999')
        .lineWidth(0.5)
        .stroke();

      if (!cell) continue;

      let bgColor: string | null = null;
      if (cell.isFlagged) {
        bgColor = '#EF4444';
      } else if (cell.tileType === 'Removal') {
        bgColor = '#FEE2E2';
      } else if (cell.tileType === 'Paid') {
        if (cell.isNew) {
          bgColor = '#22C55E';
        } else if (cell.tier === 'Premium Placement') {
          bgColor = '#F59E0B';
        } else {
          bgColor = '#3B82F6';
        }
      }

      if (bgColor) {
        doc
          .rect(x + 0.5, rowY + 0.5, w - 1, cellH - 1)
          .fillColor(bgColor)
          .fill();
      }

      const textColor =
        cell.isFlagged || cell.tileType === 'Paid' ? '#FFFFFF' : '#000000';
      const textX = x + 3;
      const textW = w - 6;

      doc.fontSize(6).font('Helvetica-Bold').fillColor(textColor);
      doc.text(cell.label, textX, rowY + 4, {
        width: textW,
        height: cellH - 12,
        lineBreak: true,
        ellipsis: false,
      });

      if (cell.isFlagged) {
        doc.fontSize(5).font('Helvetica-Bold').fillColor('#FFFFFF');
        doc.text('Flag', textX, rowY + cellH - 9, { width: textW });
      } else if (cell.tileType === 'Removal') {
        doc.fontSize(5).font('Helvetica').fillColor('#DC2626');
        doc.text('REMOVE', textX, rowY + cellH - 9, { width: textW });
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
  const notesY = colHeaderBottom + gridH * cellH + 15;

  const newTiles = chart.tiles.filter((t) => t.isNew && t.tileType === 'Paid');
  const flaggedTiles = chart.tiles.filter((t) => t.isFlagged);
  const removalNames = chart.removals.map((r) => r.brochureName);

  const noteLines: string[] = [];

  if (newTiles.length > 0) {
    noteLines.push(`NEW: ${newTiles.map((t) => t.label).join(', ')}`);
  }

  if (flaggedTiles.length > 0) {
    for (const t of flaggedTiles) {
      noteLines.push(`FLAG — ${t.label}: ${t.flagNote || 'Flagged'}`);
    }
  }

  if (removalNames.length > 0) {
    noteLines.push(`REMOVE & RECYCLE: ${removalNames.join(', ')}`);
  }

  if (chart.generalNotes) {
    noteLines.push(`Notes: ${chart.generalNotes}`);
  }

  if (noteLines.length > 0) {
    let currentNoteY = notesY;

    if (currentNoteY + noteLines.length * 12 > pageH - margin) {
      doc.addPage();
      currentNoteY = margin;
    }

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
    doc.text('Driver notes:', margin, currentNoteY);
    currentNoteY += 14;

    doc.fontSize(8).font('Helvetica').fillColor('#000000');
    for (const line of noteLines) {
      doc.text(line, margin, currentNoteY, { width: contentW * 0.6 });
      currentNoteY += doc.heightOfString(line, { width: contentW * 0.6 }) + 2;
    }
  }

  // ── Legend ──
  const legendY =
    notesY + (noteLines.length > 0 ? noteLines.length * 12 + 20 : 0);
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
  const clampedLegendY = Math.min(legendY, pageH - margin - 25);

  for (const item of legend) {
    doc
      .rect(legendX, clampedLegendY, swatchSize, swatchSize)
      .fillColor(item.color)
      .fill();
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#000000')
      .text(item.label, legendX + swatchSize + 4, clampedLegendY + 1, {
        width: legendItemW - swatchSize - 4,
      });
    legendX += legendItemW;
  }

  // Print date (bottom-right)
  const printDateY = Math.max(
    legendY + 20,
    colHeaderBottom + gridH * cellH + 15,
  );
  const finalPrintDateY = Math.min(printDateY, pageH - margin - 15);
  doc.fontSize(8).font('Helvetica').fillColor('#000000');
  doc.text(
    `Print date: ${formatDate(new Date().toISOString().split('T')[0]!)}`,
    margin,
    finalPrintDateY,
    { align: 'right', width: contentW },
  );

  const buffer = await finalize(doc);

  return {
    buffer,
    filename: `fill-chart-${chart.location.name.replace(/[^a-zA-Z0-9-_]/g, '_')}-${MONTH_NAMES[month - 1]}-${year}.pdf`,
  };
}
