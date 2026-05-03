import type { ApiData } from '@/lib/api/types';

export type InventoryStockLevel = 'Low' | 'On Target' | 'Overstock';

export type InventoryIntakeTransactionType = 'Delivery' | 'Start Count';

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

export interface InventoryTransaction {
  id: string;
  inventoryItemId: string;
  transactionType: InventoryIntakeTransactionType;
  transactionDate: string;
  boxes: number;
  balanceBeforeBoxes: number;
  balanceAfterBoxes: number;
  notes: string | null;
  createdBy: string | null;
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

export type CreateInventoryIntakeRequest = ApiData<
  CreateInventoryIntakePayload,
  {
    item: InventoryItem;
    transaction: InventoryTransaction;
    created: boolean;
  }
>;
