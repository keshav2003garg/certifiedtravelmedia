import type { PaginatedResponse } from '@repo/server-utils/types/util.types';
import type { z } from '@repo/utils/zod';
import type {
  Brochure,
  BrochureImage,
  BrochureImagePackSize,
} from '@services/database/types';
import type {
  brochureIdValidator,
  createBrochureImageValidator,
  createBrochureValidator,
  createImagePackSizeValidator,
  deleteBrochureImageValidator,
  deleteBrochureValidator,
  deleteImagePackSizeValidator,
  listBrochuresValidator,
  updateBrochureImageValidator,
  updateBrochureValidator,
  updateImagePackSizeValidator,
} from './brochures.validators';

export type ListBrochuresParams = z.infer<
  (typeof listBrochuresValidator)['query']
>;

export type BrochureIdParams = z.infer<(typeof brochureIdValidator)['param']>;

export type CreateBrochureInput = z.infer<
  (typeof createBrochureValidator)['json']
>;

export type UpdateBrochureInput = z.infer<
  (typeof updateBrochureValidator)['json']
>;

export type DeleteBrochureParams = z.infer<
  (typeof deleteBrochureValidator)['param']
>;

export type CreateBrochureImageInput = z.infer<
  (typeof createBrochureImageValidator)['json']
>;

export type UpdateBrochureImageInput = z.infer<
  (typeof updateBrochureImageValidator)['json']
>;

export type DeleteBrochureImageParams = z.infer<
  (typeof deleteBrochureImageValidator)['param']
>;

export type CreateImagePackSizeInput = z.infer<
  (typeof createImagePackSizeValidator)['json']
>;

export type UpdateImagePackSizeInput = z.infer<
  (typeof updateImagePackSizeValidator)['json']
>;

export type DeleteImagePackSizeParams = z.infer<
  (typeof deleteImagePackSizeValidator)['param']
>;

export type BrochureListItem = Brochure & {
  brochureTypeName: string;
  customerName: string | null;
  primaryImageUrl: string | null;
  imageCount: number;
  packSizeCount: number;
};

export type BrochurePackSizeWithUsage = BrochureImagePackSize & {
  inventoryItemCount: number;
};

export type BrochureImageWithPackSizes = BrochureImage & {
  packSizes: BrochurePackSizeWithUsage[];
};

export type BrochureDetail = BrochureListItem & {
  images: BrochureImageWithPackSizes[];
};

export type ListBrochuresResult = PaginatedResponse<BrochureListItem>;
