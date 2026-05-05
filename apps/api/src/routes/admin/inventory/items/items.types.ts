import type db from '@/db';

import type { PaginatedResponse } from '@repo/server-utils/types/util.types';
import type { z } from '@repo/utils/zod';
import type {
  InventoryItem,
  InventoryTransaction,
  InventoryTransactionInsert,
} from '@services/database/types';
import type {
  createInventoryIntakeValidator,
  createInventoryItemTransactionValidator,
  downloadInventoryBulkQrLabelsValidator,
  exportInventoryItemsValidator,
  getInventoryItemValidator,
  listInventoryItemsValidator,
  listInventoryItemTransactionsValidator,
} from './items.validators';

export type ListInventoryItemsParams = z.infer<
  (typeof listInventoryItemsValidator)['query']
>;

export type DownloadInventoryBulkQrLabelsParams = z.infer<
  (typeof downloadInventoryBulkQrLabelsValidator)['query']
>;

export type ExportInventoryItemsParams = z.infer<
  (typeof exportInventoryItemsValidator)['query']
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

export interface InventoryItemsSummary {
  totalItems: number;
  totalBoxes: number;
  warehouses: number;
}

export interface InventoryBulkQrLabelItem {
  brochureName: string;
  qrCodeUrl: string;
  coverPhotoUrl: string | null;
  boxes: number;
  unitsPerBox: number;
}

export type ListInventoryItemsResult = PaginatedResponse<InventoryListItem> & {
  summary: InventoryItemsSummary;
};
export type DownloadInventoryBulkQrLabelsResult = InventoryBulkQrLabelItem[];
export type ListInventoryItemTransactionsResult =
  PaginatedResponse<InventoryTransactionListItem>;

export type CreateInventoryIntakeInput = z.infer<
  (typeof createInventoryIntakeValidator)['json']
>;

export type CreateInventoryItemTransactionInput = z.infer<
  (typeof createInventoryItemTransactionValidator)['json']
>;

export type InventoryItemWriteTx = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

export type InventoryItemRecord = InventoryItem;
export type InventoryItemTransactionInsert = InventoryTransactionInsert;

export type TransferInventoryItemTransactionInput = Extract<
  CreateInventoryItemTransactionInput,
  { transactionType: 'Transfer' }
>;

export type DirectInventoryItemTransactionInput = Exclude<
  CreateInventoryItemTransactionInput,
  TransferInventoryItemTransactionInput
>;

export interface InventoryIntakeResult {
  item: InventoryItem;
  transaction: InventoryTransaction;
  created: boolean;
}

export interface ResolvedIntakeCustomer {
  id: string | null;
  name: string | null;
}

export interface InventoryItemTransactionResult {
  item: InventoryItem;
  transaction: InventoryTransaction;
  destinationItem?: InventoryItem;
  destinationTransaction?: InventoryTransaction;
  createdDestinationItem?: boolean;
}
