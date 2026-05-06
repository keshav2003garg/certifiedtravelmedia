import type { ApiData } from '@/lib/api/types';

export type TransactionType = 'Delivery' | 'Start Count';

export type InventoryRequestStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled';

export type InventoryRequestSortBy =
  | 'createdAt'
  | 'updatedAt'
  | 'dateReceived'
  | 'status'
  | 'brochureName';

export type SortOrder = 'asc' | 'desc';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface InventoryRequest {
  id: string;
  status: InventoryRequestStatus;
  warehouseId: string | null;
  brochureTypeId: string | null;
  brochureName: string | null;
  customerName: string | null;
  imageUrl: string | null;
  dateReceived: string;
  boxes: number;
  unitsPerBox: number;
  transactionType: TransactionType;
  notes: string | null;
  rejectionReason: string | null;
  requestedBy: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  warehouseName: string | null;
  brochureTypeName: string | null;
  requestedByName: string | null;
  requestedByEmail: string | null;
}

export interface InventoryRequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  pendingBoxes: number;
}

export type CreateInventoryRequestPayload = {
  warehouseId: string;
  brochureTypeId: string;
  brochureName: string;
  customerName?: string;
  imageUrl?: string;
  dateReceived: string;
  boxes: number;
  unitsPerBox: number;
  transactionType?: TransactionType;
  notes?: string;
};

export type CreateInventoryRequestRequest = ApiData<
  CreateInventoryRequestPayload,
  {
    request: {
      id: string;
      status: 'Pending';
      createdAt: string;
    };
  }
>;

export type ListInventoryRequestsRequest = ApiData<
  {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: InventoryRequestSortBy;
    order?: SortOrder;
    status?: InventoryRequestStatus;
    transactionType?: TransactionType;
    warehouseId?: string;
    brochureTypeId?: string;
    brochureId?: string;
    requestedBy?: string;
  },
  {
    requests: InventoryRequest[];
    pagination: Pagination;
  }
>;

export type GetInventoryRequestStatsRequest = ApiData<
  undefined,
  { stats: InventoryRequestStats }
>;

export type GetInventoryRequestRequest = ApiData<
  { id: string },
  { request: InventoryRequest }
>;

export type ApproveInventoryRequestPayload = {
  warehouseId: string;
  brochureTypeId: string;
  customerId?: string;
  customerName?: string;
  brochureName: string;
  imageUrl?: string;
  dateReceived: string;
  boxes: number;
  unitsPerBox: number;
  transactionType: TransactionType;
  notes?: string;
};

export type ApproveInventoryRequestRequest = ApiData<
  ApproveInventoryRequestPayload,
  {
    request: {
      id: string;
      status: 'Approved';
      reviewedAt: string | null;
    };
  }
>;

export type RejectInventoryRequestPayload = {
  rejectionReason: string;
};

export type RejectInventoryRequestRequest = ApiData<
  RejectInventoryRequestPayload,
  {
    request: {
      id: string;
      status: 'Rejected';
      reviewedAt: string | null;
      rejectionReason: string | null;
    };
  }
>;
