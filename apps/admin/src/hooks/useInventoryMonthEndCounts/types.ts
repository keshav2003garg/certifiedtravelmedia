import type {
  InventoryStockLevel,
  InventoryTransaction,
  Pagination,
  SortOrder,
} from '@/hooks/useInventoryItems/types';
import type { ApiData } from '@/lib/api/types';

export interface InventoryMonthEndCount {
  id: string;
  inventoryItemId: string;
  month: number;
  year: number;
  countedBoxes: number;
  balanceBeforeBoxes: number;
  distributionBoxes: number;
  balanceAfterBoxes: number;
  distributionTransactionId: string | null;
  countedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MonthEndCountSortBy =
  | 'warehouseName'
  | 'brochureName'
  | 'brochureTypeName'
  | 'customerName'
  | 'boxes'
  | 'unitsPerBox'
  | 'stockLevel'
  | 'countedBoxes'
  | 'distributionBoxes'
  | 'updatedAt';

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
  stockLevel: InventoryStockLevel;
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

export type ListMonthEndCountsRequest = ApiData<
  {
    month: number;
    year: number;
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: MonthEndCountSortBy;
    order?: SortOrder;
    warehouseId?: string;
    brochureTypeId?: string;
    stockLevel?: InventoryStockLevel;
  },
  {
    items: MonthEndCountListItem[];
    pagination: Pagination;
  }
>;

export type BulkMonthEndCountRequest = ApiData<
  {
    month: number;
    year: number;
    counts: Array<{
      inventoryItemId: string;
      countedBoxes: number;
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
