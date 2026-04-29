import type { ApiData } from '@/lib/api/types';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type BrochureTypeSortBy = 'name' | 'colSpan' | 'createdAt' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

export interface BrochureType {
  id: string;
  name: string;
  colSpan: number;
  createdAt: string;
  updatedAt: string;
}

export type ListBrochureTypesRequest = ApiData<
  {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: BrochureTypeSortBy;
    order?: SortOrder;
  },
  {
    brochureTypes: BrochureType[];
    pagination: Pagination;
  }
>;

export type GetBrochureTypeRequest = ApiData<
  { id: string },
  { brochureType: BrochureType }
>;

export type CreateBrochureTypeRequest = ApiData<
  {
    name: string;
    colSpan: number;
  },
  { brochureType: BrochureType }
>;

export type UpdateBrochureTypeRequest = ApiData<
  {
    id: string;
    body: Partial<CreateBrochureTypeRequest['payload']>;
  },
  { brochureType: BrochureType }
>;

export type DeleteBrochureTypeRequest = ApiData<
  string,
  { brochureType: BrochureType }
>;
