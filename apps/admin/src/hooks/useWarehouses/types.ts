import type { ApiData, ExternalApiData } from '@/lib/api/types';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type WarehouseSortBy =
  | 'name'
  | 'acumaticaId'
  | 'createdAt'
  | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

export interface Sector {
  id: string;
  acumaticaId: string;
  description: string;
}

export type WarehouseSector = Pick<
  Sector,
  'id' | 'acumaticaId' | 'description'
>;

export interface Warehouse {
  id: string;
  acumaticaId: string | null;
  name: string;
  address: string | null;
  isActive: boolean;
  sectors: WarehouseSector[];
  sectorCount: number;
  inventoryItemCount: number;
  createdAt: string;
  updatedAt: string;
}

export type ListWarehousesRequest = ApiData<
  {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: WarehouseSortBy;
    order?: SortOrder;
    includeInactive?: boolean;
  },
  {
    warehouses: Warehouse[];
    pagination: Pagination;
  }
>;

export type GetWarehouseRequest = ApiData<
  { id: string },
  { warehouse: Warehouse }
>;

export type ListSectorsRequest = ApiData<
  { page?: number; limit?: number; search?: string },
  { sectors: Sector[]; pagination: Pagination }
>;

export type CreateWarehouseRequest = ApiData<
  {
    name: string;
    acumaticaId?: string;
    address?: string;
    isActive?: boolean;
    sectorIds: string[];
  },
  { warehouse: Warehouse }
>;

export type UpdateWarehouseRequest = ApiData<
  {
    id: string;
    body: Partial<CreateWarehouseRequest['payload']>;
  },
  { warehouse: Warehouse }
>;

export type RetireWarehouseRequest = ApiData<string, { warehouse: Warehouse }>;

export type ExportWarehousesRequest = ExternalApiData<
  { includeInactive?: boolean },
  void
>;

export type DownloadFullTruckLoadRequest = ExternalApiData<
  { id: string; warehouseName: string; month: number; year: number },
  void
>;
