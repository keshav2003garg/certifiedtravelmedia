import type { ApiData } from '@/lib/api/types';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type ChartStatus = 'Draft' | 'Completed' | 'Archived';
export type TileType = 'Paid' | 'Filler';

export interface ChartLocation {
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

export interface ChartTile {
  id: string;
  col: number;
  row: number;
  colSpan: number;
  tileType: TileType;
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

export interface ChartInventoryItem {
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

export interface ChartLayout {
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
  status: ChartStatus;
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
  availableInventory: ChartInventoryItem[];
  paidTiles: ChartTile[];
  tiles: ChartTile[];
}

export interface SectorStandSize {
  width: number;
  height: number;
  locationCount: number;
  matchedLocationCount: number;
  chartLayoutId: string | null;
  chartStatus: ChartStatus | null;
  locked: boolean;
  locations: ChartLocation[];
}

export interface SectorWithStandSizes {
  id: string;
  acumaticaId: string;
  description: string;
  matchesSearch: boolean;
  standSizes: SectorStandSize[];
}

export type ListSectorStandSizesRequest = ApiData<
  {
    month?: number;
    year?: number;
    page?: number;
    limit?: number;
    search?: string;
  },
  { sectors: SectorWithStandSizes[]; pagination: Pagination }
>;

export type GetSectorChartRequest = ApiData<
  {
    sectorId: string;
    width: number;
    height: number;
    month: number;
    year: number;
  },
  { chart: ChartLayout }
>;

export type OpenSectorChartsPdfRequest = ApiData<
  {
    sectorId: string;
    width: number;
    height: number;
    month: number;
    year: number;
  },
  Blob
>;

export interface TilePayload {
  id?: string;
  col: number;
  row: number;
  colSpan?: number;
  tileType: TileType;
  inventoryItemId?: string | null;
  contractId?: string | null;
  brochureTypeId?: string | null;
  label?: string | null;
  coverPhotoUrl?: string | null;
  isNew?: boolean;
  isFlagged?: boolean;
  flagNote?: string | null;
}

export type SaveChartRequest = ApiData<
  {
    id: string;
    tiles: TilePayload[];
    generalNotes?: string | null;
  },
  { chart: ChartLayout }
>;

export type UpsertTileRequest = ApiData<
  { chartId: string; tile: TilePayload },
  { tile: TilePayload & { id: string } }
>;

export type DeleteTileRequest = ApiData<
  { chartId: string; tileId: string },
  { deleted: boolean }
>;

export type CompleteChartRequest = ApiData<
  { id: string },
  { chart: ChartLayout }
>;

export type CloneChartRequest = ApiData<
  { id: string; force?: boolean },
  { chart: ChartLayout }
>;

export type InitializeSectorChartRequest = ApiData<
  {
    sectorId: string;
    width: number;
    height: number;
    month: number;
    year: number;
  },
  { chart: ChartLayout }
>;
