import type { PaginatedResponse } from '@repo/server-utils/types/util.types';
import type { z } from '@repo/utils/zod';
import type { Sector, Warehouse } from '@services/database/types';
import type {
  createWarehouseValidator,
  exportWarehousesValidator,
  fullTruckLoadValidator,
  listSectorsValidator,
  listWarehousesValidator,
  updateWarehouseValidator,
  warehouseIdValidator,
} from './warehouses.validators';

export type ListWarehousesParams = z.infer<
  (typeof listWarehousesValidator)['query']
>;

export type WarehouseIdParams = z.infer<(typeof warehouseIdValidator)['param']>;

export type CreateWarehouseInput = z.infer<
  (typeof createWarehouseValidator)['json']
>;

export type UpdateWarehouseInput = z.infer<
  (typeof updateWarehouseValidator)['json']
>;

export type ListSectorsParams = z.infer<(typeof listSectorsValidator)['query']>;

export type ExportWarehousesParams = z.infer<
  (typeof exportWarehousesValidator)['query']
>;

export type FullTruckLoadParams = z.infer<
  (typeof fullTruckLoadValidator)['query']
>;

export type WarehouseSectorSummary = Pick<
  Sector,
  'id' | 'description' | 'acumaticaId'
>;

export type WarehouseWithDetails = Warehouse & {
  sectors: WarehouseSectorSummary[];
  sectorCount: number;
  inventoryItemCount: number;
};

export type ListWarehousesResult = PaginatedResponse<WarehouseWithDetails>;

export type FullTruckLoadDistribution = {
  description: string;
  size: string;
  contractNumber: string | null;
  endDate: string | null;
};

export type FullTruckLoadResult = {
  warehouseName: string;
  distributions: FullTruckLoadDistribution[];
};
