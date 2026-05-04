import type { PaginatedResponse } from '@repo/server-utils/types/util.types';
import type { z } from '@repo/utils/zod';
import type {
  InventoryMonthEndCount,
  InventoryTransaction,
} from '@services/database/types';
import type {
  bulkMonthEndCountValidator,
  listMonthEndCountsValidator,
} from './counts.validators';

export type ListMonthEndCountsInput = z.infer<
  (typeof listMonthEndCountsValidator)['query']
>;

export interface MonthEndCountListItem {
  inventoryItemId: string;
  warehouseId: string;
  warehouseName: string;
  warehouseAcumaticaId: string | null;
  brochureId: string;
  brochureName: string;
  brochureTypeId: string;
  brochureTypeName: string;
  customerId: string | null;
  customerName: string | null;
  brochureImageId: string;
  brochureImagePackSizeId: string;
  imageUrl: string | null;
  unitsPerBox: number;
  stockLevel: string;
  currentBoxes: number;
  countBasisBoxes: number;
  countId: string | null;
  countedBoxes: number | null;
  distributionBoxes: number;
  balanceAfterBoxes: number | null;
  distributionTransactionId: string | null;
  countedBy: string | null;
  countedAt: string | null;
  inventoryUpdatedAt: string;
}

export type ListMonthEndCountsResult = PaginatedResponse<MonthEndCountListItem>;

export type BulkMonthEndCountInput = z.infer<
  (typeof bulkMonthEndCountValidator)['json']
>;

export type SavedMonthEndCount = Omit<InventoryMonthEndCount, 'notes'>;

export interface BulkMonthEndCountResultItem {
  inventoryItemId: string;
  count: SavedMonthEndCount;
  transaction: InventoryTransaction | null;
  created: boolean;
  updated: boolean;
  skipped: boolean;
}

export interface BulkMonthEndCountResult {
  counts: BulkMonthEndCountResultItem[];
}
