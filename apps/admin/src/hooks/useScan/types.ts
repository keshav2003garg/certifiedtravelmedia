import type { InventoryTransaction } from '@/hooks/useInventoryItems/types';
import type { ApiData } from '@/lib/api/types';

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

export interface ScanMonthEndCount {
  id: string;
  inventoryItemId: string;
  month: number;
  year: number;
  endCount: number;
  createdAt: string;
  updatedAt: string;
}

export type ResolveScanInventoryItemRequest = ApiData<
  string,
  {
    resolved: ResolvedScanInventoryItem;
  }
>;

export type GetScanInventoryItemRequest = ApiData<
  string,
  {
    item: ScanInventoryItem;
  }
>;

export type SubmitScanCountPayload = {
  month: number;
  year: number;
  endCount: number;
};

export type SubmitScanCountRequest = ApiData<
  {
    id: string;
    body: SubmitScanCountPayload;
  },
  {
    count: {
      inventoryItemId: string;
      count: ScanMonthEndCount;
      transaction: InventoryTransaction | null;
      created: boolean;
      updated: boolean;
      skipped: boolean;
      resolved: ResolvedScanInventoryItem;
    };
  }
>;
