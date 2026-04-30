import type { ApiData } from '@/lib/api/types';

export type TransactionType = 'Delivery';

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
