import type {
  ChartLayout,
  ChartTile as DbChartTile,
  ContractTierValue,
  Location,
} from '@services/database/types';
import type { Removal } from '@/utils/fill-chart';

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

export type ChartLocation = Pick<Location, 'id' | 'name' | 'address'> & {
  pockets: { width: number; height: number };
};

export type ChartResult = Pick<
  ChartLayout,
  'month' | 'year' | 'generalNotes'
> & {
  location: ChartLocation;
  persisted: boolean;
  tiles: ChartTile[];
  removals: Removal[];
};

export type ChartRemoval = Removal;
