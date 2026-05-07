import type { PaginatedResponse } from '@repo/server-utils/types/util.types';
import type { z } from '@repo/utils/zod';
import type {
  Brochure,
  BrochureImage,
  BrochureImagePackSize,
} from '@services/database/types';
import type { readInventoryBrochuresValidator } from './brochures.validators';

export type ReadInventoryBrochuresParams = z.infer<
  (typeof readInventoryBrochuresValidator)['query']
>;

export type ListInventoryBrochuresParams = Omit<
  ReadInventoryBrochuresParams,
  'id'
>;

export type InventoryBrochureListItem = Brochure & {
  brochureTypeName: string;
  customerName: string | null;
  primaryImageUrl: string | null;
  imageCount: number;
  packSizeCount: number;
};

export type InventoryBrochurePackSizeWithUsage = BrochureImagePackSize & {
  inventoryItemCount: number;
};

export type InventoryBrochureImageWithPackSizes = BrochureImage & {
  packSizes: InventoryBrochurePackSizeWithUsage[];
};

export type InventoryBrochureDetail = InventoryBrochureListItem & {
  images: InventoryBrochureImageWithPackSizes[];
};

export type ListInventoryBrochuresResult =
  PaginatedResponse<InventoryBrochureListItem>;
