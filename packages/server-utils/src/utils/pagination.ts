import type {
  PaginatedResponse,
  PaginationParams,
} from '@repo/server-utils/types/util.types';

export function buildPaginationResponse(
  page: number,
  limit: number,
  total: number,
) {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export function getPaginationOffset(params: PaginationParams) {
  return (params.page - 1) * params.limit;
}

interface CreatePaginatedResultParams<T> extends PaginationParams {
  data: T[];
  total: number;
}

export function createPaginatedResult<T>({
  data,
  page,
  limit,
  total,
}: CreatePaginatedResultParams<T>): PaginatedResponse<T> {
  return {
    data,
    pagination: buildPaginationResponse(page, limit, total),
  };
}
