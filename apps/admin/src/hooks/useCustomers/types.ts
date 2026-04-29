import type { ApiData } from '@/lib/api/types';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type CustomerSortBy = 'name' | 'acumaticaId' | 'createdAt' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

export interface Customer {
  id: string;
  acumaticaId: string;
  name: string;
  brochureCount: number;
  contractCount: number;
  createdAt: string;
  updatedAt: string;
}

export type ListCustomersRequest = ApiData<
  {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: CustomerSortBy;
    order?: SortOrder;
  },
  {
    customers: Customer[];
    pagination: Pagination;
  }
>;

export type GetCustomerRequest = ApiData<
  { id: string },
  { customer: Customer }
>;

export type CreateCustomerRequest = ApiData<
  {
    acumaticaId: string;
    name: string;
  },
  { customer: Customer }
>;

export type UpdateCustomerRequest = ApiData<
  {
    id: string;
    body: Partial<CreateCustomerRequest['payload']>;
  },
  { customer: Customer }
>;

export type DeleteCustomerRequest = ApiData<string, { customer: Customer }>;
