import type {
  InventoryTransaction,
  Pagination,
} from '@/hooks/useInventoryItems/types';
import type { ApiData } from '@/lib/api/types';

export interface InventoryMonthEndCount {
  id: string;
  inventoryItemId: string;
  month: number;
  year: number;
  endCount: number;
  createdAt: string;
  updatedAt: string;
}

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

export interface MonthEndCountsListPayload {
  month?: number;
  year: number;
  page?: number;
  limit?: number;
  search?: string;
  warehouseId?: string;
  brochureTypeId?: string;
}

export type ListMonthEndCountsRequest = ApiData<
  MonthEndCountsListPayload,
  {
    items: MonthEndCountListItem[];
    pagination: Pagination;
  }
>;

export type ListSubmittedMonthEndCountsRequest = ApiData<
  MonthEndCountsListPayload,
  {
    items: SubmittedMonthEndCountListItem[];
    pagination: Pagination;
  }
>;

export type BulkMonthEndCountRequest = ApiData<
  {
    month: number;
    year: number;
    counts: Array<{
      inventoryItemId: string;
      endCount: number;
    }>;
  },
  {
    counts: Array<{
      inventoryItemId: string;
      count: InventoryMonthEndCount;
      transaction: InventoryTransaction | null;
      created: boolean;
      updated: boolean;
      skipped: boolean;
    }>;
  }
>;
