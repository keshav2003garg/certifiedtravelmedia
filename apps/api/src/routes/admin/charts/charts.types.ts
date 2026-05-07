import type { PaginatedResponse } from '@repo/server-utils/types/util.types';
import type { z } from '@repo/utils/zod';
import type {
  cloneChartValidator,
  exportPocketsSoldReportValidator,
  getSectorChartValidator,
  initializeSectorChartValidator,
  listArchivesValidator,
  listChartsValidator,
  saveChartValidator,
  upsertTileValidator,
} from './charts.validators';

export type ListChartsParams = z.infer<typeof listChartsValidator.query>;
export type ExportPocketsSoldReportParams = z.infer<
  typeof exportPocketsSoldReportValidator.query
>;
export type GetSectorChartParams = z.infer<
  typeof getSectorChartValidator.query
>;
export type InitializeSectorChartInput = z.infer<
  typeof initializeSectorChartValidator.json
>;
export type SaveChartInput = z.infer<typeof saveChartValidator.json>;
export type TileInput = z.infer<typeof upsertTileValidator.json>;
export type CloneChartInput = z.infer<typeof cloneChartValidator.json>;
export type ListArchivesParams = z.infer<typeof listArchivesValidator.query>;

export interface ChartLocationResult {
  id: string;
  locationId: string | null;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  pockets: { width: number; height: number };
  chartUrl: string;
  matchesSearch: boolean;
}

export interface SectorStandSizeResult {
  width: number;
  height: number;
  locationCount: number;
  matchedLocationCount: number;
  chartLayoutId: string | null;
  chartStatus: 'Draft' | 'Completed' | 'Archived' | null;
  locked: boolean;
  locations: ChartLocationResult[];
}

export interface SectorChartsResult {
  id: string;
  acumaticaId: string;
  description: string;
  matchesSearch: boolean;
  standSizes: SectorStandSizeResult[];
}

export type ListChartsResult = PaginatedResponse<SectorChartsResult>;

export interface ChartTileResult {
  id: string;
  col: number;
  row: number;
  colSpan: number;
  tileType: 'Paid' | 'Filler';
  warehouseId: string | null;
  warehouseName: string | null;
  warehouseAcumaticaId: string | null;
  brochureTypeId: string | null;
  brochureTypeName: string | null;
  brochureId: string | null;
  brochureName: string | null;
  inventoryItemId: string | null;
  contractId: string | null;
  label: string | null;
  coverPhotoUrl: string | null;
  unitsPerBox: number | null;
  boxes: number | null;
  stockLevel: string | null;
  isNew: boolean;
  isFlagged: boolean;
  flagNote: string | null;
  tier: 'Premium Placement' | 'Normal Placement' | null;
  contractEndDate: string | null;
  customerName: string | null;
  acumaticaContractId: string | null;
}

export interface ChartInventoryItemResult {
  id: string;
  warehouseId: string;
  warehouseName: string;
  warehouseAcumaticaId: string | null;
  brochureTypeId: string;
  brochureTypeName: string;
  brochureId: string;
  brochureName: string;
  coverPhotoUrl: string | null;
  unitsPerBox: number;
  boxes: number;
  stockLevel: string;
  colSpan: number;
  customerName: string | null;
}

export interface ChartLayoutResult {
  id: string | null;
  sectorId: string;
  sectorDescription: string | null;
  sectorAcumaticaId: string | null;
  standWidth: number;
  standHeight: number;
  displayName: string;
  displayDescription: string | null;
  month: number;
  year: number;
  status: 'Draft' | 'Completed' | 'Archived';
  locked: boolean;
  generalNotes: string | null;
  gridSize: { width: number; height: number };
  completedAt: string | null;
  completedBy: string | null;
  archivedAt: string | null;
  archivedBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  persisted: boolean;
  locationCount: number;
  availableInventory: ChartInventoryItemResult[];
  paidTiles: ChartTileResult[];
  tiles: ChartTileResult[];
}

export interface ArchiveListItem {
  id: string;
  chartLayoutId: string;
  displayName: string;
  sectorDescription: string | null;
  sectorAcumaticaId: string | null;
  standWidth: number;
  standHeight: number;
  month: number;
  year: number;
  totalPaid: number;
  totalFillers: number;
  archivedAt: string | null;
}

export interface ArchiveSnapshot {
  layout: Omit<
    ChartLayoutResult,
    'tiles' | 'persisted' | 'locationCount' | 'availableInventory' | 'paidTiles'
  >;
  tiles: ChartTileResult[];
  metadata: {
    displayName: string;
    sectorDescription: string | null;
    sectorAcumaticaId: string | null;
    standWidth: number;
    standHeight: number;
    gridSize: { width: number; height: number };
    totalPaid: number;
    totalFillers: number;
    totalEmpty: number;
    archivedAt: string | null;
  };
}

export interface ArchiveDetail {
  id: string;
  chartLayoutId: string;
  archivedAt: string | null;
  snapshot: ArchiveSnapshot;
}
