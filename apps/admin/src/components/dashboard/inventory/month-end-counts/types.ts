import type { MonthEndCountListItem } from '@/hooks/useInventoryMonthEndCounts/types';
import type { useInventoryMonthEndCountsFilters } from '@/hooks/useInventoryMonthEndCounts/useInventoryMonthEndCountsFilters';

export type MonthEndCountFilters = ReturnType<
  typeof useInventoryMonthEndCountsFilters
>;

export interface MonthEndCountRow {
  item: MonthEndCountListItem;
  countedBoxes: number | null;
  distributionBoxes: number;
}
