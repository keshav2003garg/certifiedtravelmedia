import type { PaginatedResponse } from '@repo/server-utils/types/util.types';
import type { z } from '@repo/utils/zod';
import type {
  InventoryItem,
  InventoryTransaction,
} from '@services/database/types';
import type {
  createInventoryIntakeValidator,
  getInventoryItemValidator,
  listInventoryItemsValidator,
  listInventoryItemTransactionsValidator,
} from './items.validators';

export type ListInventoryItemsParams = z.infer<
  (typeof listInventoryItemsValidator)['query']
>;

export type GetInventoryItemParams = z.infer<
  (typeof getInventoryItemValidator)['param']
>;

export type ListInventoryItemTransactionsParams = z.infer<
  (typeof listInventoryItemTransactionsValidator)['query']
>;

export type InventoryListItem = InventoryItem & {
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
};

export type InventoryItemDetail = InventoryListItem & {
  warehouseAddress: string | null;
  brochureCreatedAt: string;
  brochureUpdatedAt: string;
  brochureImageCreatedAt: string;
  brochureImageUpdatedAt: string;
  packSizeCreatedAt: string;
  packSizeUpdatedAt: string;
};

export type InventoryTransactionListItem = InventoryTransaction & {
  createdByName: string | null;
  createdByEmail: string | null;
};

export type ListInventoryItemsResult = PaginatedResponse<InventoryListItem>;
export type ListInventoryItemTransactionsResult =
  PaginatedResponse<InventoryTransactionListItem>;

export type CreateInventoryIntakeInput = z.infer<
  (typeof createInventoryIntakeValidator)['json']
>;

export interface InventoryIntakeResult {
  item: InventoryItem;
  transaction: InventoryTransaction;
  created: boolean;
}
