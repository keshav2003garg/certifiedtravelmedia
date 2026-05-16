import type { ApiData, ExternalApiData } from '@/lib/api/types';

export type InventoryStockLevel = 'Low' | 'On Target' | 'Overstock';

export type InventoryTransactionType =
  | 'Delivery'
  | 'Distribution'
  | 'Recycle'
  | 'Trans In'
  | 'Trans Out'
  | 'Return to Client'
  | 'Adjustment'
  | 'Start Count';

export type InventoryIntakeTransactionType = Extract<
  InventoryTransactionType,
  'Delivery' | 'Start Count'
>;

export type InventoryItemTransactionActionType =
  | 'Transfer'
  | Extract<
      InventoryTransactionType,
      | 'Delivery'
      | 'Start Count'
      | 'Return to Client'
      | 'Recycle'
      | 'Adjustment'
    >;

export type InventoryItemSortBy =
  | 'warehouseName'
  | 'brochureName'
  | 'brochureTypeName'
  | 'customerName'
  | 'boxes'
  | 'unitsPerBox'
  | 'stockLevel'
  | 'createdAt'
  | 'updatedAt';

export type SortOrder = 'asc' | 'desc';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface InventoryItem {
  id: string;
  warehouseId: string;
  brochureImagePackSizeId: string;
  boxes: number;
  stockLevel: InventoryStockLevel;
  qrCodeUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryListItem extends InventoryItem {
  warehouseName: string;
  warehouseAcumaticaId: string | null;
  brochureId: string;
  brochureName: string;
  brochureTypeId: string;
  brochureTypeName: string;
  customerId: string | null;
  customerName: string | null;
  brochureImageId: string;
  imageUrl: string | null;
  unitsPerBox: number;
}

export interface InventoryItemsSummary {
  totalItems: number;
  totalBoxes: number;
  warehouses: number;
}

export interface InventoryItemDetail extends InventoryListItem {
  warehouseAddress: string | null;
  brochureCreatedAt: string;
  brochureUpdatedAt: string;
  brochureImageCreatedAt: string;
  brochureImageUpdatedAt: string;
  packSizeCreatedAt: string;
  packSizeUpdatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  inventoryItemId: string;
  transactionType: InventoryTransactionType;
  transactionDate: string;
  boxes: number;
  balanceBeforeBoxes: number;
  balanceAfterBoxes: number;
  requestId: string | null;
  transferGroupId: string | null;
  sourceWarehouseId: string | null;
  destinationWarehouseId: string | null;
  notes: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdByEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateInventoryIntakePayload = {
  warehouseId: string;
  brochureTypeId: string;
  customerId?: string;
  customerName?: string;
  brochureName: string;
  imageUrl?: string;
  boxes: number;
  unitsPerBox: number;
  transactionType: InventoryIntakeTransactionType;
  transactionDate: string;
  notes?: string;
};

export type CreateInventoryItemTransactionPayload = {
  boxes: number;
  notes?: string;
} & (
  | {
      transactionType: 'Transfer';
      destinationWarehouseId: string;
    }
  | {
      transactionType: Extract<
        InventoryTransactionType,
        'Delivery' | 'Start Count' | 'Return to Client' | 'Recycle'
      >;
    }
  | {
      transactionType: 'Adjustment';
    }
);

export type ListInventoryItemsRequest = ApiData<
  {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: InventoryItemSortBy;
    order?: SortOrder;
    warehouseId?: string;
    brochureId?: string;
    brochureTypeId?: string;
    stockLevel?: InventoryStockLevel;
  },
  {
    inventoryItems: InventoryListItem[];
    pagination: Pagination;
    summary: InventoryItemsSummary;
  }
>;

export type InventoryItemsDownloadFilters = Pick<
  ListInventoryItemsRequest['payload'],
  | 'search'
  | 'sortBy'
  | 'order'
  | 'warehouseId'
  | 'brochureId'
  | 'brochureTypeId'
  | 'stockLevel'
>;

export type DownloadInventoryBulkQrLabelsRequest = ExternalApiData<
  InventoryItemsDownloadFilters,
  Blob
>;

export type ExportInventoryItemsRequest = ExternalApiData<
  InventoryItemsDownloadFilters,
  Blob
>;

export type GetInventoryItemRequest = ApiData<
  string,
  {
    item: InventoryItemDetail;
  }
>;

export type ListInventoryItemTransactionsRequest = ApiData<
  {
    page?: number;
    limit?: number;
    transactionType?: InventoryTransactionType;
    dateFrom?: string;
    dateTo?: string;
  },
  {
    transactions: InventoryTransaction[];
    pagination: Pagination;
  }
>;

export type CreateInventoryIntakeRequest = ApiData<
  CreateInventoryIntakePayload,
  {
    item: InventoryItem;
    transaction: InventoryTransaction;
    created: boolean;
  }
>;

export type CreateInventoryItemTransactionRequest = ApiData<
  {
    id: string;
    body: CreateInventoryItemTransactionPayload;
  },
  {
    item: InventoryItem;
    transaction: InventoryTransaction;
    destinationItem?: InventoryItem;
    destinationTransaction?: InventoryTransaction;
    createdDestinationItem?: boolean;
  }
>;
