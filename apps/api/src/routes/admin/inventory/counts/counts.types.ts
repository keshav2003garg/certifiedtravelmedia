import type { PaginatedResponse } from '@repo/server-utils/types/util.types';
import type { z } from '@repo/utils/zod';
import type { InventoryTransaction } from '@services/database/types';
import type {
  bulkMonthEndCountValidator,
  getScanInventoryItemValidator,
  listMonthEndCountsValidator,
  listSubmittedMonthEndCountsValidator,
  resolveScanInventoryItemValidator,
  saveScanMonthEndCountValidator,
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
  brochureImageId: string;
  brochureImagePackSizeId: string;
  imageUrl: string | null;
  unitsPerBox: number;
  countId: string | null;
  previousMonthEndCount: number;
  transactionBoxes: number;
  distributionBoxes: number | null;
  endCount: number | null;
  inventoryUpdatedAt: string;
}

export type ListMonthEndCountsResult = PaginatedResponse<MonthEndCountListItem>;

export type ListSubmittedMonthEndCountsInput = z.infer<
  (typeof listSubmittedMonthEndCountsValidator)['query']
>;

export interface SubmittedMonthEndCountListItem {
  inventoryItemId: string;
  warehouseId: string;
  warehouseName: string;
  warehouseAcumaticaId: string | null;
  brochureId: string;
  brochureName: string;
  brochureTypeId: string;
  brochureTypeName: string;
  brochureImageId: string;
  brochureImagePackSizeId: string;
  imageUrl: string | null;
  unitsPerBox: number;
  countId: string;
  month: number;
  year: number;
  endCount: number;
  submittedAt: string;
}

export type ListSubmittedMonthEndCountsResult =
  PaginatedResponse<SubmittedMonthEndCountListItem>;

export type BulkMonthEndCountInput = z.infer<
  (typeof bulkMonthEndCountValidator)['json']
>;

export interface SavedMonthEndCount {
  id: string;
  inventoryItemId: string;
  month: number;
  year: number;
  endCount: number;
  createdAt: string;
  updatedAt: string;
}

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

export type ResolveScanInventoryItemInput = z.infer<
  (typeof resolveScanInventoryItemValidator)['param']
>;

export type GetScanInventoryItemInput = z.infer<
  (typeof getScanInventoryItemValidator)['param']
>;

export type SaveScanMonthEndCountInput = z.infer<
  (typeof saveScanMonthEndCountValidator)['json']
>;

export interface ResolvedScanInventoryItem {
  requestedInventoryItemId: string;
  inventoryItemId: string;
  isLegacy: boolean;
  shouldRedirect: boolean;
}

export interface ScanInventoryItem {
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
  boxes: number;
  unitsPerBox: number;
  stockLevel: string;
  inventoryUpdatedAt: string;
}

export type ScanMonthEndCountResult = BulkMonthEndCountResultItem & {
  resolved: ResolvedScanInventoryItem;
};
