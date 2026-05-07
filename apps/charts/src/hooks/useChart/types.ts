import type {
  ChartLayout,
  ChartTile as DbChartTile,
  ContractTierValue,
  Location,
} from '@services/database/types';
import type { ApiData } from '@/lib/api/types';

export type ChartLocation = Pick<Location, 'id' | 'name' | 'address'> & {
  pockets: { width: number; height: number };
};

export type ChartTile = Pick<
  DbChartTile,
  | 'id'
  | 'col'
  | 'row'
  | 'colSpan'
  | 'tileType'
  | 'label'
  | 'coverPhotoUrl'
  | 'isNew'
  | 'isFlagged'
  | 'flagNote'
> & {
  brochureTypeName: string | null;
  customFillerId: string | null;
  contractId: string | null;
  contractEndDate: string | null;
  tier: ContractTierValue | null;
  customerName: string | null;
};

export interface ChartRemoval {
  brochureName: string;
  type: 'BROCH' | 'MAG';
  expiredDate: string;
  size: { cols: number; rows: number };
  position: { col: number; row: number };
  contractId: string;
}

export type Chart = Pick<ChartLayout, 'month' | 'year' | 'generalNotes'> & {
  location: ChartLocation;
  persisted: boolean;
  tiles: ChartTile[];
  removals: ChartRemoval[];
};

export type GetChartRequest = ApiData<
  { locationId: string; month?: number; year?: number },
  Chart
>;
