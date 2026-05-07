import type { ApiData } from '@/lib/api/types';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type BrochureSortBy =
  | 'name'
  | 'brochureTypeName'
  | 'customerName'
  | 'createdAt'
  | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

export interface Brochure {
  id: string;
  name: string;
  brochureTypeId: string;
  customerId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  brochureTypeName: string;
  customerName: string | null;
  primaryImageUrl: string | null;
  imageCount: number;
  packSizeCount: number;
}

export interface BrochureImagePackSize {
  id: string;
  brochureImageId: string;
  unitsPerBox: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  inventoryItemCount: number;
}

export interface BrochureImage {
  id: string;
  brochureId: string;
  imageUrl: string | null;
  sortOrder: number;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
  packSizes: BrochureImagePackSize[];
}

export interface BrochureDetail extends Brochure {
  images: BrochureImage[];
}

export type ListBrochuresRequest = ApiData<
  {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: BrochureSortBy;
    order?: SortOrder;
    brochureTypeId?: string;
    customerId?: string;
    hasImages?: boolean;
    hasPackSizes?: boolean;
  },
  {
    brochures: Brochure[];
    pagination: Pagination;
  }
>;

export type GetBrochureRequest = ApiData<
  { id: string },
  { brochure: BrochureDetail }
>;
